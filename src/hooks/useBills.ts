import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, where, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

// Google Calendar-style recurrence rule
export interface RecurrenceRule {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom';
    interval?: number;           // e.g., every 2 weeks
    unit?: 'day' | 'week' | 'month' | 'year';
    byDay?: string[];            // ['MO', 'WE', 'FR'] for specific days
    byMonthDay?: number;         // 15 for "monthly on the 15th"
    bySetPos?: number;           // 2 for "second Wednesday"  
    byWeekDay?: string;          // 'WE' for Wednesday
    endType?: 'never' | 'count' | 'until';
    endCount?: number;           // After X occurrences
    endDate?: string;            // ISO date string
}

export interface Bill {
    id: string; // Firestore IDs are strings
    name: string;
    amount: number;
    dueDate: string; // ISO String
    dueDateIso: string; // ISO String (legacy field, we'll keep for compat)
    status: 'overdue' | 'due_soon' | 'due_today' | 'upcoming' | 'paid';
    icon: string;
    category: string;
    paycheckLabel: string;
    cycle: 'current' | 'next' | 'previous';
    // Recurrence (Google Calendar style)
    recurrence?: RecurrenceRule;
    recurrenceSummary?: string; // Human-readable e.g., "Monthly on day 15"
    // Legacy Planning Fields (deprecated, use recurrence instead)
    frequency?: string;
    dueDay?: number;
    dueMonth?: number;
    dueDayOfWeek?: string;
    color?: string; // For UI theme
    assignedPaycheckId?: string; // For Planning bucket
    isTentative?: boolean; // Inspired by Koffan's "uncertain" items
    // Optional fields
    companyName?: string;
    website?: string;
    username?: string;
    password?: string;
    accountNumber?: string;
    notes?: string;
    comments?: any[];
    householdId?: string;
    owner?: string; // 'Ernesto' | 'Steph' | 'Joint'
}

export function useBills() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const STORAGE_KEY = 'pchk_bills';

    useEffect(() => {
        if (!user) {
            setBills([]);
            setLoading(false);
            return;
        }

        // Demo User Logic
        if ((user as any).isDemo) {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
                try {
                    setBills(JSON.parse(localData));
                } catch (e) {
                    console.error("Failed to parse local bills", e);
                    setBills([]);
                }
            } else {
                setBills([]);
            }
            setLoading(false);
            return;
        }

        // Firestore Logic
        const q = query(collection(db, 'bills'), where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBills: Bill[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Bill[];

            setBills(fetchedBills);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const saveToLocal = (newBills: Bill[]) => {
        setBills(newBills);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBills));
    };

    const addBill = async (billData: Omit<Bill, 'id'>) => {
        if (!user) return;

        if ((user as any).isDemo) {
            const newBill = { ...billData, id: `bill_${Date.now()}` } as Bill;
            saveToLocal([...bills, newBill]);
            return;
        }

        try {
            await addDoc(collection(db, 'bills'), {
                ...billData,
                ownerId: user.uid,
                createdAt: Timestamp.now()
            });
        } catch (e) {
            console.error("Failed to add bill:", e);
            throw e;
        }
    };

    const updateBill = async (id: string, data: Partial<Bill>) => {
        if ((user as any).isDemo) {
            const updatedBills = bills.map(b => b.id === id ? { ...b, ...data } : b);
            saveToLocal(updatedBills);
            return;
        }
        await updateDoc(doc(db, 'bills', id), data);
    };

    const addBillComment = async (id: string, comment: any) => {
        if ((user as any).isDemo) {
            const updatedBills = bills.map(b => {
                if (b.id === id) {
                    return { ...b, comments: [...(b.comments || []), comment] };
                }
                return b;
            });
            saveToLocal(updatedBills);
            return;
        }
        await updateDoc(doc(db, 'bills', id), {
            comments: arrayUnion(comment)
        });
    };

    const markAsPaid = async (id: string, amountPaid: number) => {
        if ((user as any).isDemo) {
            const updatedBills = bills.map(b => b.id === id ? { ...b, status: 'paid', amount: amountPaid } : b);
            saveToLocal(updatedBills as Bill[]);
            return;
        }
        await updateDoc(doc(db, 'bills', id), {
            status: 'paid',
            amount: amountPaid
        });
    };

    const batchUpdateBills = async (updates: { id: string, data: Partial<Bill> }[]) => {
        if ((user as any).isDemo) {
            let updatedBills = [...bills];
            updates.forEach(update => {
                updatedBills = updatedBills.map(b => b.id === update.id ? { ...b, ...update.data } : b);
            });
            saveToLocal(updatedBills);
            return;
        }

        // Parallel execution for Firestore (simplest implementation)
        try {
            await Promise.all(updates.map(update => updateDoc(doc(db, 'bills', update.id), update.data)));
        } catch (e) {
            console.error("Batch update failed:", e);
        }
    };

    const deleteBill = async (id: string) => {
        if ((user as any).isDemo) {
            const updatedBills = bills.filter(b => b.id !== id);
            saveToLocal(updatedBills);
            return;
        }
        await deleteDoc(doc(db, 'bills', id));
    };

    return { bills, loading, addBill, updateBill, addBillComment, markAsPaid, deleteBill, batchUpdateBills };
}
