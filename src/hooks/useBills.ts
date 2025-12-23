import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, where, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from './useGroup';

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
    logoUrl?: string; // Custom logo URL (overrides auto-detection)
    website?: string;
    paymentUrl?: string; // URL to pay the bill online
    username?: string;
    password?: string;
    accountNumber?: string;
    notes?: string;
    comments?: any[];
    householdId?: string;
    groupId?: string; // Added groupId
    owner?: string; // 'Ernesto' | 'Steph' | 'Joint'
    history?: any[]; // Payment history
    lastPaid?: string;
}

export function useBills() {
    const { group, canEditBills, canMarkPaid } = useGroup();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const STORAGE_KEY = 'pchk_bills';
    const isDemo = user?.email === 'demo@pck2pck.app';
    const groupId = group?.id;

    useEffect(() => {
        if (!user) {
            setBills([]);
            setLoading(false);
            return;
        }

        if (isDemo || !groupId) {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    setBills(JSON.parse(stored));
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
        const q = query(
            collection(db, 'bills'),
            where('groupId', '==', groupId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBills: Bill[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Bill[];

            setBills(fetchedBills);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching bills:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isDemo, groupId]);

    const saveToLocal = (newBills: Bill[]) => {
        setBills(newBills);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBills));
    };

    const addBill = async (billData: Omit<Bill, 'id'>) => {
        if (!user) return;

        if (!canEditBills && !isDemo) {
            throw new Error("Permission denied: You cannot add bills.");
        }

        if (isDemo || !groupId) {
            const newBill = { ...billData, id: `bill_${Date.now()}` } as Bill;
            saveToLocal([...bills, newBill]);
            return;
        }

        try {
            await addDoc(collection(db, 'bills'), {
                ...billData,
                groupId: groupId,
                createdBy: user?.uid,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Failed to add bill:", e);
            throw e;
        }
    };

    const updateBill = async (id: string, updates: Partial<Bill>) => {
        const isStatusUpdateOnly = Object.keys(updates).every(k =>
            ['status', 'paidDate', 'lastPaid', 'history', 'amount'].includes(k) // Added amount to allowed updates for marking paid
        );

        if (!canEditBills && !isDemo && !isStatusUpdateOnly) {
            throw new Error("Permission denied: You cannot edit bill details.");
        }

        if (isDemo || !groupId) {
            const updatedBills = bills.map(b => b.id === id ? { ...b, ...updates } : b);
            saveToLocal(updatedBills);
            return;
        }
        await updateDoc(doc(db, 'bills', id), updates);
    };

    const addBillComment = async (id: string, comment: any) => {
        // Comments are allowed for now by anyone? Let's assume yes.
        if (isDemo || !groupId) {
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

    const markAsPaid = async (billIdOrBill: string | Bill, amountPaid: number, paidDate: Date = new Date()) => {
        if (!canMarkPaid && !isDemo) {
            throw new Error("Permission denied.");
        }

        // Handle both bill ID (string) and bill object
        const billId = typeof billIdOrBill === 'string' ? billIdOrBill : billIdOrBill.id;
        const bill = bills.find(b => b.id === billId);
        
        if (!bill) {
            throw new Error(`Bill with ID ${billId} not found`);
        }

        const newHistoryItem = {
            date: paidDate.toISOString(),
            amount: amountPaid,
            paidBy: user?.displayName || 'User'
        };

        const updates: any = {
            status: 'paid',
            paidDate: paidDate.toISOString(),
            amount: amountPaid,
            history: [...(bill.history || []), newHistoryItem],
            lastPaid: paidDate.toISOString()
        };

        // Note: Recurrence updating of due date is typically done via a separate "complete" action or inferred.
        // For now, we just mark this instance as paid. 
        // Logic for rolling over to next month is in the Planning screen or manual.

        if (isDemo || !groupId) {
            const updatedBills = bills.map(b => b.id === billId ? { ...b, ...updates } : b);
            saveToLocal(updatedBills);
            return;
        }

        await updateDoc(doc(db, 'bills', billId), updates);
    };

    const batchUpdateBills = async (updates: { id: string, data: Partial<Bill> }[]) => {
        if (!canEditBills && !isDemo) {
            throw new Error("Permission denied.");
        }

        if (isDemo || !groupId) {
            let updatedBills = [...bills];
            updates.forEach(update => {
                updatedBills = updatedBills.map(b => b.id === update.id ? { ...b, ...update.data } : b);
            });
            saveToLocal(updatedBills);
            return;
        }

        try {
            await Promise.all(updates.map(update => updateDoc(doc(db, 'bills', update.id), update.data)));
        } catch (e) {
            console.error("Batch update failed:", e);
        }
    };

    const deleteBill = async (id: string) => {
        if (!canEditBills && !isDemo) {
            throw new Error("Permission denied: You cannot delete bills.");
        }

        if (isDemo || !groupId) {
            const updatedBills = bills.filter(b => b.id !== id);
            saveToLocal(updatedBills);
            return;
        }
        await deleteDoc(doc(db, 'bills', id));
    };

    return { bills, loading, addBill, updateBill, addBillComment, markAsPaid, deleteBill, batchUpdateBills };
}
