import { useState, useEffect, useMemo } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    arrayUnion,
    arrayRemove,
    getDoc,
    deleteField
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// --- Types ---

export interface GroupMember {
    id: string; // matches auth uid
    name: string;
    email: string;
    photoURL?: string;
    role: 'admin' | 'member';
    joinedAt: number; // Timestamp
}

export interface Group {
    id: string;
    name: string;
    createdAt: any;
    // Map of memberId -> GroupMember for easy lookup
    members: { [key: string]: GroupMember };
    // Array of memberIds for security rules querying ( "uid" in resource.data.memberIds )
    memberIds: string[];
    inviteCode?: string;
}

// --- Hook ---

export function useGroup() {
    const { user } = useAuth();
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isDemo = user?.email === 'demo@pck2pck.app';
    const userId = user?.uid;

    // Derived State
    const membersList = useMemo(() => {
        if (!group) return [];
        return Object.values(group.members);
    }, [group]);

    const isAdmin = useMemo(() => {
        if (!group || !userId) return false;
        return group.members[userId]?.role === 'admin';
    }, [group, userId]);

    // Permissions
    const canManageGroup = isAdmin;
    const canEditBills = isAdmin;
    // Members can view and pay, but not edit details
    const canMarkPaid = true; // All members can mark paid

    // Subscribe to Group Data
    useEffect(() => {
        if (!userId || isDemo) {
            // Demo Mode
            setGroup({
                id: 'demo-group',
                name: 'Demo Family',
                createdAt: new Date(),
                members: {
                    'demo-user': {
                        id: 'demo-user',
                        name: 'Demo User',
                        email: 'demo@pck2pck.app',
                        role: 'admin',
                        joinedAt: Date.now()
                    }
                },
                memberIds: ['demo-user']
            });
            setLoading(false);
            return;
        }

        // Find the group the user belongs to
        // NOTE: For MVP we assume 1 group per user. 
        // We need to query which group contains this user.
        // This query requires an index on `memberIds`.
        const groupsRef = collection(db, 'groups');
        const q = query(groupsRef, where('memberIds', 'array-contains', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                const data = docSnap.data();
                setGroup({
                    id: docSnap.id,
                    name: data.name,
                    createdAt: data.createdAt,
                    members: data.members || {},
                    memberIds: data.memberIds || [],
                    inviteCode: data.inviteCode
                });
            } else {
                setGroup(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching group:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, isDemo]);

    // --- Actions ---

    const createGroup = async (name: string) => {
        if (!userId || isDemo) return;

        const newGroupId = doc(collection(db, 'groups')).id;
        const groupRef = doc(db, 'groups', newGroupId);

        const newMember: GroupMember = {
            id: userId,
            name: user?.displayName || 'Admin',
            email: user?.email || '',
            photoURL: user?.photoURL || undefined,
            role: 'admin',
            joinedAt: Date.now()
        };

        const newGroup = {
            name,
            createdAt: serverTimestamp(),
            members: {
                [userId]: newMember
            },
            memberIds: [userId]
        };

        await setDoc(groupRef, newGroup);
    };

    const joinGroup = async (inviteCode: string) => {
        if (!userId || isDemo) throw new Error("Authentication required");

        // 1. Find group with this invite code
        const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error("Invalid invite code");
        }

        const groupDoc = snapshot.docs[0];
        const groupRef = doc(db, 'groups', groupDoc.id);

        const newMember: GroupMember = {
            id: userId,
            name: user?.displayName || 'Member',
            email: user?.email || '',
            photoURL: user?.photoURL || undefined,
            role: 'member',
            joinedAt: Date.now()
        };

        // 2. Add user to members map and memberIds array
        await updateDoc(groupRef, {
            [`members.${userId}`]: newMember,
            memberIds: arrayUnion(userId)
        });
    };

    const generateInviteCode = async () => {
        if (!group || !canManageGroup) throw new Error("Unauthorized");

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const groupRef = doc(db, 'groups', group.id);

        await updateDoc(groupRef, {
            inviteCode: code
        });
        return code;
    };

    const removeMember = async (memberId: string) => {
        if (!group || !canManageGroup) throw new Error("Unauthorized");
        if (memberId === userId) throw new Error("Cannot remove yourself");

        const groupRef = doc(db, 'groups', group.id);

        // Remove from both map and array
        // Firestore doesn't have a "delete map field" operator easily available in updateDoc without Dot notation
        // We use string path for map key

        // Construct the update object
        // Note: FieldValue.delete() is usually imported from firebase/firestore
        /* 
           We need to import deleteField from firebase/firestore 
           But to keep it simple with current imports, we will read-modify-write or use strict dot notation?
           Actually `deleteField()` is best. Let's assume standard behavior.
        */
        // For array:
        await updateDoc(groupRef, {
            memberIds: arrayRemove(memberId),
            [`members.${memberId}`]: deleteField()
        });

        // Wait, deleteField is a Sentinel. I need to make sure I import it if I use it.
        // Let's defer strict implementation or just import `deleteField` if I can.
        // Since I can't easily see imports without reading file again, I'll use a safer approach:
        // Read, modify object, write back? No, race conditions.
        // I will use `update` with `deleteField()` sentinel. 
    };

    // Re-implementation of removeMember with correct import in next step or ignore for now
    // Actually, I can just do it right in the CodeContent if I add the import.

    const updateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
        if (!group || !canManageGroup) throw new Error("Unauthorized");

        const groupRef = doc(db, 'groups', group.id);
        await updateDoc(groupRef, {
            [`members.${memberId}.role`]: newRole
        });
    };

    return {
        group,
        membersList,
        loading,
        error,
        isAdmin,
        canManageGroup,
        canEditBills,
        canMarkPaid,
        createGroup,
        joinGroup,
        generateInviteCode,
        removeMember,
        updateMemberRole
    };
}
