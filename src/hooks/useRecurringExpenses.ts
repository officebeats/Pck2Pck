import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../components/CommentModal';

export interface RecurringExpense {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    nextDueText: string;
    cycle: 'current' | 'next';
    paycheckLabel?: string;
    category: string;
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    isWarning?: boolean;
    reminder: {
        enabled: boolean;
        daysBefore: number;
        time: string;
    };
    dueDay?: number;
    dueDayOfWeek?: string;
    comments?: Comment[];
    ownerId?: string;
}

export function useRecurringExpenses() {
    const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Migration Effect
    useEffect(() => {
        if (!user) return;

        const migrateData = async () => {
            const localData = localStorage.getItem('pchk_recurring_bills');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log("Migrating local recurring expenses to Firestore...");
                        for (const item of parsed) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { id, ...data } = item; // Remove numeric ID
                            await addDoc(collection(db, 'recurring_expenses'), {
                                ...data,
                                ownerId: user.uid
                            });
                        }
                        localStorage.removeItem('pchk_recurring_bills');
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
            setExpenses([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'recurring_expenses'), where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedExpenses: RecurringExpense[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RecurringExpense[];

            setExpenses(fetchedExpenses);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addExpense = async (expense: Omit<RecurringExpense, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'recurring_expenses'), {
            ...expense,
            ownerId: user.uid
        });
    };

    const updateExpense = async (id: string, updates: Partial<RecurringExpense>) => {
        await updateDoc(doc(db, 'recurring_expenses', id), updates);
    };

    const deleteExpense = async (id: string) => {
        await deleteDoc(doc(db, 'recurring_expenses', id));
    };

    return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
