import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useGroup } from './useGroup';
import { RecurrenceRule } from './useBills';

export interface IncomeSource {
    id: string; // Firestore IDs are strings
    name: string;
    amount: number;
    frequencyDisplay: string;
    recurrence: RecurrenceRule;
    nextPayday: string; // YYYY-MM-DD
    icon: string;
    logoUrl?: string; // Custom logo URL (overrides auto-detection)
    ownerId?: string;
    groupId?: string; // Added groupId
}

export function useIncomeSources() {
    const { group, canEditBills } = useGroup();
    const [sources, setSources] = useState<IncomeSource[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const isDemo = user?.email === 'demo@pck2pck.app';
    const groupId = group?.id;

    // Firestore Sync
    useEffect(() => {
        if (!user) {
            setSources([]);
            setLoading(false);
            return;
        }

        if (isDemo || !groupId) {
            const localData = localStorage.getItem('pchk_income_sources');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    setSources(Array.isArray(parsed) ? parsed : []);
                } catch {
                    setSources([]);
                }
            } else {
                setSources([]);
            }
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'income_sources'), where('groupId', '==', groupId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSources: IncomeSource[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IncomeSource[];

            setSources(fetchedSources);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isDemo, groupId]);

    const addSource = async (source: Omit<IncomeSource, 'id'>) => {
        if (!user) return;

        if (!canEditBills && !isDemo) {
            throw new Error("Permission denied: You cannot add income sources.");
        }

        if (isDemo || !groupId) {
            const newSource = { ...source, id: Date.now().toString() };
            const newSources = [...sources, newSource];
            setSources(newSources);
            localStorage.setItem('pchk_income_sources', JSON.stringify(newSources));
            return;
        }

        await addDoc(collection(db, 'income_sources'), {
            ...source,
            groupId: groupId,
            ownerId: user.uid // Keep track of creator
        });
    };

    const updateSource = async (id: string, updates: Partial<IncomeSource>) => {
        if (!user) return;

        if (!canEditBills && !isDemo) {
            throw new Error("Permission denied: You cannot edit income sources.");
        }

        if (isDemo || !groupId) {
            const newSources = sources.map(s => s.id === id ? { ...s, ...updates } : s);
            setSources(newSources);
            localStorage.setItem('pchk_income_sources', JSON.stringify(newSources));
            return;
        }

        await updateDoc(doc(db, 'income_sources', id), updates);
    };

    const deleteSource = async (id: string) => {
        if (!user) return;

        if (!canEditBills && !isDemo) {
            throw new Error("Permission denied: You cannot delete income sources.");
        }

        if (isDemo || !groupId) {
            const newSources = sources.filter(s => s.id !== id);
            setSources(newSources);
            localStorage.setItem('pchk_income_sources', JSON.stringify(newSources));
            return;
        }

        await deleteDoc(doc(db, 'income_sources', id));
    };

    return { sources, loading, addSource, updateSource, deleteSource };
}
