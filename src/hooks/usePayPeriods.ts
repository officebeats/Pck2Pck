import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface PayPeriod {
    id: string; // Firestore ID
    label: string;
    projectedIncome: number;
    startDate?: string;
    endDate?: string;
    ownerId: string;
}

export function usePayPeriods() {
    const [periods, setPeriods] = useState<PayPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Migration Effect
    useEffect(() => {
        if (!user) return;

        const migrateData = async () => {
            const key = `pchk_periods_${user.uid}`;
            const localData = localStorage.getItem(key);

            // Also check legacy key if exists
            const oldKey = `pchk_cycles_${user.uid}`;
            const legacyData = localStorage.getItem(oldKey);

            const dataToMigrate = localData || legacyData;

            if (dataToMigrate) {
                try {
                    const parsed = JSON.parse(dataToMigrate);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log("Migrating local pay periods to Firestore...");
                        for (const item of parsed) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { id, ...data } = item; // Remove any old ID
                            // Check if already exists to avoid dupes during partial migration
                            // But for simple migration we might just add. 
                            // Better: we assume if we are migrating, we haven't synced yet.
                            // However, let's keep it simple.
                            await addDoc(collection(db, 'pay_periods'), {
                                ...data,
                                ownerId: user.uid
                            });
                        }
                        localStorage.removeItem(key);
                        localStorage.removeItem(oldKey);
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
            setPeriods([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'pay_periods'), where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPeriods: PayPeriod[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PayPeriod[];

            setPeriods(fetchedPeriods);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getPeriod = (label: string) => {
        return periods.find(p => p.label === label);
    };

    const updatePeriodIncome = async (label: string, income: number) => {
        if (!user) return;

        const existingPeriod = periods.find(p => p.label === label);

        if (existingPeriod) {
            await updateDoc(doc(db, 'pay_periods', existingPeriod.id), {
                projectedIncome: income
            });
        } else {
            await addDoc(collection(db, 'pay_periods'), {
                label,
                projectedIncome: income,
                ownerId: user.uid
            });
        }
    };

    return {
        periods,
        loading,
        getPeriod,
        updatePeriodIncome
    };
}
