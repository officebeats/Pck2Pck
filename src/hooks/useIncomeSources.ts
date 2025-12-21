import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

import { RecurrenceRule } from './useBills';

export interface IncomeSource {
    id: string; // Firestore IDs are strings
    name: string;
    amount: number;
    frequencyDisplay: string;
    recurrence: RecurrenceRule;
    nextPayday: string; // YYYY-MM-DD
    icon: string;
    ownerId?: string;
}

export function useIncomeSources() {
    const [sources, setSources] = useState<IncomeSource[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Migration Effect: Check for local data and move to Firestore
    useEffect(() => {
        if (!user || (user as any).isDemo) return;

        const migrateData = async () => {
            const localData = localStorage.getItem('pchk_income_sources');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log("Migrating local income sources to Firestore...");
                        for (const item of parsed) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { id, ...data } = item; // Remove numeric ID
                            await addDoc(collection(db, 'income_sources'), {
                                ...data,
                                ownerId: user.uid
                            });
                        }
                        localStorage.removeItem('pchk_income_sources');
                        console.log("Migration complete.");
                    }
                } catch (e) {
                    console.error("Migration failed", e);
                }
            }
        };

        migrateData();
    }, [user]);

    // Firestore Sync
    useEffect(() => {
        if (!user) {
            setSources([]);
            setLoading(false);
            return;
        }

        if ((user as any).isDemo) {
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

        const q = query(collection(db, 'income_sources'), where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSources: IncomeSource[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IncomeSource[];

            setSources(fetchedSources);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addSource = async (source: Omit<IncomeSource, 'id'>) => {
        if (!user) return;

        if ((user as any).isDemo) {
            const newSource = { ...source, id: Date.now().toString() };
            const newSources = [...sources, newSource];
            setSources(newSources);
            localStorage.setItem('pchk_income_sources', JSON.stringify(newSources));
            return;
        }

        await addDoc(collection(db, 'income_sources'), {
            ...source,
            ownerId: user.uid
        });
    };

    const updateSource = async (id: string, updates: Partial<IncomeSource>) => {
        if (!user) return;

        if ((user as any).isDemo) {
            const newSources = sources.map(s => s.id === id ? { ...s, ...updates } : s);
            setSources(newSources);
            localStorage.setItem('pchk_income_sources', JSON.stringify(newSources));
            return;
        }

        await updateDoc(doc(db, 'income_sources', id), updates);
    };

    const deleteSource = async (id: string) => {
        if (!user) return;

        if ((user as any).isDemo) {
            const newSources = sources.filter(s => s.id !== id);
            setSources(newSources);
            localStorage.setItem('pchk_income_sources', JSON.stringify(newSources));
            return;
        }

        await deleteDoc(doc(db, 'income_sources', id));
    };

    return { sources, loading, addSource, updateSource, deleteSource };
}
