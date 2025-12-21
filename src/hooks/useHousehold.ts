import { useState, useEffect, useMemo } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// --- Types ---

export interface HouseholdMember {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    role: 'admin' | 'member';
    status: 'active' | 'pending' | 'invited';
    invitedAt?: Date;
    joinedAt?: Date;
}

export interface Household {
    id: string;
    name: string;
    adminId: string;
    members: HouseholdMember[];
    createdAt: Date;
    inviteCode?: string;
}

export interface HouseholdInvite {
    id: string;
    householdId: string;
    householdName: string;
    invitedBy: string;
    invitedByName: string;
    email?: string;
    phone?: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: Date;
    expiresAt: Date;
}

// --- Hook ---

export function useHousehold() {
    const { user } = useAuth();
    const [household, setHousehold] = useState<Household | null>(null);
    const [members, setMembers] = useState<HouseholdMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingInvites, setPendingInvites] = useState<HouseholdInvite[]>([]);

    const isDemo = user?.email === 'demo@pck2pck.app';
    const userId = user?.uid;

    // Compute if in solo mode (only one active member)
    const isSoloMode = useMemo(() => {
        const activeMembers = members.filter(m => m.status === 'active');
        return activeMembers.length <= 1;
    }, [members]);

    // Check if current user is admin
    const isAdmin = useMemo(() => {
        return household?.adminId === userId;
    }, [household, userId]);

    // Subscribe to household data
    useEffect(() => {
        if (!userId || isDemo) {
            // Demo mode - create mock solo household
            setHousehold({
                id: 'demo-household',
                name: 'My Household',
                adminId: 'demo',
                members: [{
                    id: 'demo',
                    name: user?.displayName || 'Demo User',
                    email: 'demo@pck2pck.app',
                    role: 'admin',
                    status: 'active'
                }],
                createdAt: new Date()
            });
            setMembers([{
                id: 'demo',
                name: user?.displayName || 'Demo User',
                email: 'demo@pck2pck.app',
                role: 'admin',
                status: 'active'
            }]);
            setLoading(false);
            return;
        }

        const householdRef = doc(db, 'users', userId, 'household', 'main');

        const unsubscribe = onSnapshot(householdRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const householdData: Household = {
                    id: snapshot.id,
                    name: data.name || 'My Household',
                    adminId: data.adminId || userId,
                    members: data.members || [],
                    createdAt: data.createdAt?.toDate() || new Date(),
                    inviteCode: data.inviteCode
                };
                setHousehold(householdData);
                setMembers(householdData.members);
            } else {
                // Create default solo household
                const defaultHousehold: Household = {
                    id: 'main',
                    name: 'My Household',
                    adminId: userId,
                    members: [{
                        id: userId,
                        name: user?.displayName || 'Me',
                        email: user?.email || '',
                        photoURL: user?.photoURL || undefined,
                        role: 'admin',
                        status: 'active',
                        joinedAt: new Date()
                    }],
                    createdAt: new Date()
                };

                // Save to Firestore
                setDoc(householdRef, {
                    ...defaultHousehold,
                    createdAt: serverTimestamp()
                }).catch(console.error);

                setHousehold(defaultHousehold);
                setMembers(defaultHousehold.members);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching household:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, isDemo, user]);

    // Generate invite link/code
    const generateInviteCode = async (): Promise<string> => {
        if (!userId || isDemo || !household) {
            throw new Error('Cannot generate invite in demo mode');
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const householdRef = doc(db, 'users', userId, 'household', 'main');

        await updateDoc(householdRef, {
            inviteCode: code,
            inviteCodeCreatedAt: serverTimestamp()
        });

        return code;
    };

    // Send invite via email or phone
    const sendInvite = async (contact: { email?: string; phone?: string; name?: string }) => {
        if (!userId || isDemo || !household) {
            throw new Error('Cannot send invite in demo mode');
        }

        if (!contact.email && !contact.phone) {
            throw new Error('Please provide an email or phone number');
        }

        const inviteId = `invite-${Date.now()}`;
        const invite: HouseholdInvite = {
            id: inviteId,
            householdId: household.id,
            householdName: household.name,
            invitedBy: userId,
            invitedByName: user?.displayName || 'Someone',
            email: contact.email,
            phone: contact.phone,
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        // Add pending member to household
        const newMember: HouseholdMember = {
            id: inviteId,
            name: contact.name || contact.email || contact.phone || 'Invited User',
            email: contact.email || '',
            role: 'member',
            status: 'invited',
            invitedAt: new Date()
        };

        const householdRef = doc(db, 'users', userId, 'household', 'main');
        const updatedMembers = [...members, newMember];

        await updateDoc(householdRef, {
            members: updatedMembers
        });

        // In a real app, we'd trigger a Cloud Function to send email/SMS here
        // For now, we'll just return the invite data for the UI to handle
        return invite;
    };

    // Add member directly
    const addMember = async (member: Omit<HouseholdMember, 'id'>) => {
        if (!userId || isDemo || !household) {
            throw new Error('Cannot add member in demo mode');
        }

        const newMember: HouseholdMember = {
            ...member,
            id: `member-${Date.now()}`,
            joinedAt: new Date()
        };

        const householdRef = doc(db, 'users', userId, 'household', 'main');
        const updatedMembers = [...members, newMember];

        await updateDoc(householdRef, {
            members: updatedMembers
        });
    };

    // Update member
    const updateMember = async (memberId: string, updates: Partial<HouseholdMember>) => {
        if (!userId || isDemo || !household) {
            throw new Error('Cannot update member in demo mode');
        }

        const householdRef = doc(db, 'users', userId, 'household', 'main');
        const updatedMembers = members.map(m =>
            m.id === memberId ? { ...m, ...updates } : m
        );

        await updateDoc(householdRef, {
            members: updatedMembers
        });
    };

    // Remove member
    const removeMember = async (memberId: string) => {
        if (!userId || isDemo || !household) {
            throw new Error('Cannot remove member in demo mode');
        }

        if (memberId === household.adminId) {
            throw new Error('Cannot remove the admin');
        }

        const householdRef = doc(db, 'users', userId, 'household', 'main');
        const updatedMembers = members.filter(m => m.id !== memberId);

        await updateDoc(householdRef, {
            members: updatedMembers
        });
    };

    // Update household name
    const updateHouseholdName = async (name: string) => {
        if (!userId || isDemo || !household) {
            throw new Error('Cannot update in demo mode');
        }

        const householdRef = doc(db, 'users', userId, 'household', 'main');
        await updateDoc(householdRef, { name });
    };

    return {
        household,
        members,
        loading,
        isSoloMode,
        isAdmin,
        pendingInvites,
        generateInviteCode,
        sendInvite,
        addMember,
        updateMember,
        removeMember,
        updateHouseholdName
    };
}

export default useHousehold;
