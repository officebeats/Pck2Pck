import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import CommentModal, { Comment } from '../components/CommentModal';
import RepeatPicker, { generateRecurrenceSummary } from '../components/RepeatPicker';
import { useBills, Bill as FirestoreBill, RecurrenceRule } from '@/hooks/useBills';
import { useIncomeSources, IncomeSource } from '@/hooks/useIncomeSources';
import { useHousehold } from '@/hooks/useHousehold';
import { useGroup } from '@/hooks/useGroup';
import { getNextOccurrences } from '@/lib/recurrence';
import Calendar from '../components/Calendar';
import { isPast, isToday, isFuture, startOfDay, isSameDay } from 'date-fns';
import { useToast, getErrorMessage } from '@/components/Toast';
import CompanyLogo from '@/components/CompanyLogo';
import CompactBillCard from '@/components/CompactBillCard';

// --- Types & Interfaces ---

/** Supported color themes for UI elements */
type ColorTheme = 'blue' | 'purple' | 'emerald' | 'amber';

/** Represents a pay cycle bucket */
interface Paycheck {
    id: string;
    date: Date;
    label: string;
    amount: number;
    color: ColorTheme;
}

/** Represents a bill item within the planning view */
// Use Firestore Bill type, but override dueDate for UI handling
interface UIBill extends Omit<FirestoreBill, 'dueDate'> {
    dueDate: Date;
}

// --- Constants & Helpers ---

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns number with ordinal suffix (e.g., 1st, 2nd, 3rd) */
const getOrdinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Returns a countdown string for a due date (e.g., "Due in 3 days", "Due Tomorrow") */
const getDueCountdown = (dueDate: Date): { label: string, isUrgent: boolean, isDueToday: boolean } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const overdue = Math.abs(diffDays);
        return { label: `${overdue}d overdue`, isUrgent: true, isDueToday: false };
    } else if (diffDays === 0) {
        return { label: 'Due Today', isUrgent: true, isDueToday: true };
    } else if (diffDays === 1) {
        return { label: 'Due Tomorrow', isUrgent: true, isDueToday: false };
    } else if (diffDays <= 7) {
        return { label: `${diffDays}d left`, isUrgent: false, isDueToday: false };
    } else {
        return { label: `${diffDays}d left`, isUrgent: false, isDueToday: false };
    }
};

/** Visual styles configuration map */
const THEME_STYLES: Record<ColorTheme, {
    bg: string;
    text: string;
    dot: string;
    border: string;
    softBg: string;
    hoverBorder: string;
    bucketBg: string;
    placeholderBorder: string;
    placeholderBg: string;
}> = {
    blue: {
        bg: 'bg-blue-600',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        border: 'border-blue-200',
        softBg: 'bg-blue-50',
        hoverBorder: 'border-blue-400',
        bucketBg: 'bg-blue-50/30',
        placeholderBorder: 'border-blue-300/50',
        placeholderBg: 'bg-blue-300/10'
    },
    purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-700',
        dot: 'bg-purple-500',
        border: 'border-purple-200',
        softBg: 'bg-purple-50',
        hoverBorder: 'border-purple-400',
        bucketBg: 'bg-purple-50/30',
        placeholderBorder: 'border-purple-300/50',
        placeholderBg: 'bg-purple-300/10'
    },
    emerald: {
        bg: 'bg-emerald-600',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-200',
        softBg: 'bg-emerald-50',
        hoverBorder: 'border-emerald-400',
        bucketBg: 'bg-emerald-50/30',
        placeholderBorder: 'border-emerald-300/50',
        placeholderBg: 'bg-emerald-300/10'
    },
    amber: {
        bg: 'bg-amber-600',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        border: 'border-amber-200',
        softBg: 'bg-amber-50',
        hoverBorder: 'border-amber-400',
        bucketBg: 'bg-amber-50/30',
        placeholderBorder: 'border-amber-300/50',
        placeholderBg: 'bg-amber-300/10'
    }
};

export default function Planning() {
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const { canEditBills, isAdmin } = useGroup();

    // --- Household/Group State ---
    const { membersList: members } = useGroup();
    const isSoloMode = members.length <= 1;

    // --- Persistent State for Bills ---
    const { bills: firestoreBills, addBill, updateBill, deleteBill, addBillComment, batchUpdateBills, markAsPaid } = useBills();

    // --- Persistent State for Income ---
    const { sources: incomeSources, addSource, updateSource, deleteSource } = useIncomeSources();

    // Sort bills by due date for consistency
    const bills = useMemo(() => {
        return firestoreBills.map(b => ({
            ...b,
            dueDate: new Date(b.dueDate) // Ensure Date object for local math
        })).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    }, [firestoreBills]);

    // Helper function to determine bill cycle based on due date
    const determineBillCycle = (dueDate: Date): 'current' | 'next' | 'previous' => {
        const today = startOfDay(new Date());
        const billDueDate = startOfDay(dueDate);
        
        // If bill is past due, it's in current cycle
        if (billDueDate < today) {
            return 'current';
        }
        
        // Determine current cycle end date based on income sources
        // Use the nearest upcoming paycheck date as cycle boundary
        const upcomingPaychecks = incomeSources
            .map(source => {
                const nextPayDate = new Date(source.nextPayday);
                return nextPayDate;
            })
            .filter(date => date >= today)
            .sort((a, b) => a.getTime() - b.getTime());
        
        // If we have upcoming paychecks, use the first one as cycle boundary
        // Otherwise, use a 14-day window as default
        const cycleEndDate = upcomingPaychecks.length > 0 
            ? upcomingPaychecks[0]
            : new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        // Bill is in current cycle if due before next paycheck
        if (billDueDate <= cycleEndDate) {
            return 'current';
        }
        
        // Otherwise it's in the next cycle
        return 'next';
    };

    // --- View State ---
    const location = useLocation();
    const [viewMode, setViewMode] = useState<'bills' | 'income'>(() => {
        const params = new URLSearchParams(location.search);
        const view = params.get('view');
        return view === 'income' ? 'income' : 'bills';
    });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false); // Collapsed by default
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('add');
    const [editingId, setEditingId] = useState<string | null>(null);

    // --- Income Modal State ---
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
    const [incomeFormData, setIncomeFormData] = useState({
        name: '',
        amount: '',
        dueDay: new Date().getDate(),
        nextPayday: new Date().toISOString().split('T')[0],
        frequencyDisplay: 'Monthly',
        logoUrl: ''
    });
    const [isIncomeRepeatPickerOpen, setIsIncomeRepeatPickerOpen] = useState(false);
    const [incomeRecurrence, setIncomeRecurrence] = useState<RecurrenceRule>({ type: 'monthly' });
    const [incomeRecurrenceSummary, setIncomeRecurrenceSummary] = useState('Monthly');

    // --- Drag & Drop State ---
    const [draggedBillId, setDraggedBillId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // --- Form State ---
    const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
    const [isRepeatPickerOpen, setIsRepeatPickerOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        frequency: 'Monthly',
        dueDay: 1,
        dueDayOfWeek: 'Monday',
        accountNumber: '',
        username: '',
        password: '',
        companyName: '',
        category: '',
        icon: 'receipt',
        dueMonth: 0,
        website: '',
        paymentUrl: '',
        notes: '',
        owner: 'Joint',
        isTentative: false,
        logoUrl: ''
    });
    const [recurrence, setRecurrence] = useState<RecurrenceRule>({ type: 'monthly', byMonthDay: 1 });
    const [recurrenceSummary, setRecurrenceSummary] = useState('Monthly on day 1');

    const [discussingBillId, setDiscussingBillId] = useState<string | null>(null);

    // --- Derived State ---
    const paychecks = useMemo(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Project income occurrences for the current month
        const allOccurrences: (Paycheck & { sourceId: string })[] = [];
        const themes: ColorTheme[] = ['emerald', 'amber', 'blue', 'purple'];

        incomeSources.forEach((source) => {
            const startDate = new Date(source.nextPayday);
            const occurrences = getNextOccurrences(source.recurrence, startDate, 10, endOfMonth);

            occurrences.forEach((occ, index) => {
                if (occ >= startOfMonth && occ <= endOfMonth) {
                    allOccurrences.push({
                        id: `inc_${source.id}_${index}`,
                        sourceId: source.id,
                        date: occ,
                        label: `${source.name} (${occ.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
                        amount: source.amount,
                        color: 'emerald', // Placeholder, will cycle below
                    });
                }
            });
        });

        // Sort by date
        const sorted = allOccurrences.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Assign colors and filter bills
        return sorted.map((p, i) => ({
            ...p,
            color: themes[i % themes.length],
            bills: bills.filter(b =>
                b.assignedPaycheckId === p.id ||
                (i === 0 && b.assignedPaycheckId === 'p1') ||
                (i === 1 && b.assignedPaycheckId === 'p2')
            )
        }));
    }, [incomeSources, bills]);

    // --- Handlers ---

    const moveBill = useCallback((billId: string, targetPaycheckId: string) => {
        updateBill(billId, { assignedPaycheckId: targetPaycheckId });
    }, [updateBill]);

    const autoAssignBills = async () => {
        if (bills.length === 0 || paychecks.length === 0) return;

        const updates: { id: string, data: Partial<FirestoreBill> }[] = [];

        // Build a map of paycheck capacities (amount - assigned bills)
        const paycheckLoads: Map<string, { amount: number, billsTotal: number, bills: string[] }> = new Map();
        paychecks.forEach(p => {
            paycheckLoads.set(p.id, { amount: p.amount, billsTotal: 0, bills: [] });
        });

        // Phase 1: Just-In-Time Assignment (Latest valid paycheck before due date)
        const billAssignments: Map<string, string> = new Map();

        bills.forEach(bill => {
            const dueDate = new Date(bill.dueDate);
            const validPaychecks = paychecks.filter(p => p.date <= dueDate);

            let targetPaycheckId = 'unassigned';
            if (validPaychecks.length > 0) {
                const bestPaycheck = validPaychecks[validPaychecks.length - 1];
                targetPaycheckId = bestPaycheck.id;
            }

            billAssignments.set(bill.id, targetPaycheckId);

            // Track the load
            if (targetPaycheckId !== 'unassigned') {
                const load = paycheckLoads.get(targetPaycheckId);
                if (load) {
                    load.billsTotal += bill.amount;
                    load.bills.push(bill.id);
                }
            }
        });

        // Phase 2: Load Smoothing - Move bills from negative paychecks to earlier ones with capacity
        const sortedPaychecks = [...paychecks].sort((a, b) => a.date.getTime() - b.date.getTime());

        for (let i = sortedPaychecks.length - 1; i >= 0; i--) {
            const currentPaycheck = sortedPaychecks[i];
            const currentLoad = paycheckLoads.get(currentPaycheck.id);
            if (!currentLoad) continue;

            const safeSpend = currentLoad.amount - currentLoad.billsTotal;

            // If this paycheck is negative, try to move bills to earlier paychecks
            if (safeSpend < 0) {
                const billsToConsider = [...currentLoad.bills];

                for (const billId of billsToConsider) {
                    const bill = bills.find(b => b.id === billId);
                    if (!bill) continue;

                    const dueDate = new Date(bill.dueDate);

                    // Try earlier paychecks (from latest to earliest)
                    for (let j = i - 1; j >= 0; j--) {
                        const earlierPaycheck = sortedPaychecks[j];
                        if (earlierPaycheck.date > dueDate) continue; // Must still be valid

                        const earlierLoad = paycheckLoads.get(earlierPaycheck.id);
                        if (!earlierLoad) continue;

                        const earlierSafeSpend = earlierLoad.amount - earlierLoad.billsTotal;

                        // Only move if the earlier paycheck can absorb the bill and stay positive
                        if (earlierSafeSpend >= bill.amount) {
                            // Move the bill
                            billAssignments.set(billId, earlierPaycheck.id);

                            // Update loads
                            currentLoad.billsTotal -= bill.amount;
                            currentLoad.bills = currentLoad.bills.filter(id => id !== billId);

                            earlierLoad.billsTotal += bill.amount;
                            earlierLoad.bills.push(billId);

                            break; // Stop looking for this bill
                        }
                    }

                    // Check if current paycheck is now positive
                    if (currentLoad.amount - currentLoad.billsTotal >= 0) break;
                }
            }
        }

        // Generate updates for bills that changed assignment
        bills.forEach(bill => {
            const newAssignment = billAssignments.get(bill.id) || 'unassigned';
            if (bill.assignedPaycheckId !== newAssignment) {
                updates.push({
                    id: bill.id,
                    data: { assignedPaycheckId: newAssignment }
                });
            }
        });

        if (updates.length > 0) {
            await batchUpdateBills(updates);
        }
    };

    // --- Modal Logic ---

    const handleOpenModal = (bill?: UIBill) => {
        setIsDayPickerOpen(false);
        if (bill) {
            setEditingId(bill.id);
            setModalMode('view');
            setFormData({
                name: bill.name,
                companyName: bill.companyName || '',
                amount: bill.amount.toString(),
                frequency: bill.frequency || 'Monthly',
                category: bill.category || '',
                icon: bill.icon,
                dueDay: bill.dueDay || 1,
                dueMonth: bill.dueMonth || bill.dueDate.getMonth(),
                dueDayOfWeek: bill.dueDayOfWeek || 'Monday',
                website: bill.website || '',
                paymentUrl: bill.paymentUrl || '',
                username: bill.username || '',
                password: bill.password || '',
                accountNumber: bill.accountNumber || '',
                notes: bill.notes || '',
                owner: bill.owner || 'Joint',
                isTentative: bill.isTentative || false,
                logoUrl: bill.logoUrl || ''
            });
            if (bill.recurrence) {
                setRecurrence(bill.recurrence);
                setRecurrenceSummary(bill.recurrenceSummary || generateRecurrenceSummary(bill.recurrence, bill.dueDate));
            } else {
                setRecurrence({ type: 'monthly', byMonthDay: bill.dueDay || 1 });
                setRecurrenceSummary(bill.frequency ? `${bill.frequency} on day ${bill.dueDay}` : 'Monthly on day 1');
            }
        } else {
            setEditingId(null);
            setModalMode('edit');
            setFormData({
                name: '',
                companyName: '',
                amount: '',
                frequency: 'Monthly',
                category: '',
                icon: 'receipt',
                dueDay: 1,
                dueMonth: 0,
                dueDayOfWeek: 'Monday',
                website: '',
                paymentUrl: '',
                username: '',
                password: '',
                accountNumber: '',
                notes: '',
                owner: 'Joint',
                isTentative: false,
                logoUrl: ''
            });
            setRecurrence({ type: 'monthly', byMonthDay: 1 });
            setRecurrenceSummary('Monthly on day 1');
        }
        setIsModalOpen(true);
    };

    const handleSaveBill = async () => {
        if (!formData.name || !formData.amount) {
            showError('Missing Information', 'Please provide both a name and amount for this bill.');
            return;
        }
        const numAmount = parseFloat(formData.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            showError('Invalid Amount', 'Please enter a valid dollar amount greater than zero.');
            return;
        }

        const today = new Date();
        let dueDate = new Date();

        if (recurrence.type === 'monthly') {
            const day = recurrence.byMonthDay || 1;
            dueDate = new Date(today.getFullYear(), today.getMonth(), day);
            if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
        } else {
            dueDate.setDate(today.getDate() + 7);
        }

        const newBillData = {
            name: formData.name,
            companyName: formData.companyName,
            logoUrl: formData.logoUrl || undefined,
            amount: numAmount,
            recurrence: recurrence,
            recurrenceSummary: recurrenceSummary,
            frequency: recurrenceSummary,
            dueDate: dueDate.toISOString(),
            dueDateIso: dueDate.toISOString(),
            cycle: determineBillCycle(dueDate),
            paycheckLabel: 'Unassigned',
            category: formData.category || 'General',
            icon: formData.icon,
            dueDay: recurrence.byMonthDay || formData.dueDay,
            dueMonth: formData.dueMonth,
            dueDayOfWeek: formData.dueDayOfWeek,
            website: formData.website,
            paymentUrl: formData.paymentUrl,
            username: formData.username,
            password: formData.password,
            accountNumber: formData.accountNumber,
            notes: formData.notes,
            color: 'blue' as ColorTheme,
            status: 'upcoming' as const,
            owner: formData.owner,
            isTentative: formData.isTentative
        };

        try {
            if (editingId) {
                await updateBill(editingId, newBillData);
                showSuccess('Bill Updated', `${formData.name} has been updated.`);
            } else {
                const defaultPaycheckId = (paychecks && paychecks.length > 0) ? paychecks[0].id : 'unassigned';
                await addBill({
                    ...newBillData,
                    assignedPaycheckId: defaultPaycheckId,
                    comments: []
                });
                showSuccess('Bill Added', `${formData.name} has been added to your bills.`);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save bill:", error);
            const errInfo = getErrorMessage(error);
            showError(errInfo.title, errInfo.message, errInfo.action ? {
                label: errInfo.action,
                onClick: () => handleSaveBill() // Retry
            } : undefined);
        }
    };

    const handleDeleteBill = async () => {
        if (editingId) {
            try {
                const billName = formData.name;
                await deleteBill(editingId);
                showSuccess('Bill Deleted', `${billName} has been removed.`);
                setIsModalOpen(false);
            } catch (error) {
                console.error("Failed to delete bill:", error);
                const errInfo = getErrorMessage(error);
                showError(errInfo.title, errInfo.message);
            }
        }
    };

    const handleAddComment = (text: string) => {
        if (!discussingBillId) return;
        const newComment: Comment = {
            id: Date.now(),
            user: 'You',
            text,
            timestamp: 'Just now',
            isMe: true
        };
        addBillComment(discussingBillId, newComment);
    };

    const discussingBill = bills.find(b => b.id === discussingBillId);

    // --- Income Handlers ---
    const handleOpenIncomeModal = (source?: IncomeSource) => {
        if (source) {
            setEditingIncomeId(source.id);
            setIncomeFormData({
                name: source.name,
                amount: source.amount.toString(),
                dueDay: new Date(source.nextPayday + 'T12:00:00').getDate(),
                nextPayday: source.nextPayday,
                frequencyDisplay: source.frequencyDisplay,
                logoUrl: source.logoUrl || ''
            });
            setIncomeRecurrence(source.recurrence || { type: 'monthly' });
            setIncomeRecurrenceSummary(source.frequencyDisplay || 'Monthly');
        } else {
            setEditingIncomeId(null);
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setIncomeFormData({
                name: '',
                amount: '',
                dueDay: today.getDate(),
                nextPayday: `${year}-${month}-${day}`,
                frequencyDisplay: 'Every 2 weeks',
                logoUrl: ''
            });
            setIncomeRecurrence({ type: 'custom', interval: 2, unit: 'week' });
            setIncomeRecurrenceSummary('Every 2 weeks');
        }
        setIsIncomeModalOpen(true);
    };

    const handleSaveIncome = async () => {
        if (!incomeFormData.name || !incomeFormData.amount) {
            showError('Missing Information', 'Please provide both a name and amount for this income.');
            return;
        }

        const numAmount = parseFloat(incomeFormData.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            showError('Invalid Amount', 'Please enter a valid dollar amount greater than zero.');
            return;
        }

        try {
            // Calculate nextPayday based on selected dueDay
            const today = new Date();
            let targetDate = new Date(today.getFullYear(), today.getMonth(), incomeFormData.dueDay);

            // If the date is in the past, move to next possible occurrence
            if (targetDate < startOfDay(today)) {
                targetDate.setMonth(targetDate.getMonth() + 1);
            }

            const data = {
                name: incomeFormData.name,
                amount: numAmount,
                nextPayday: targetDate.toISOString().split('T')[0],
                frequencyDisplay: incomeRecurrenceSummary,
                recurrence: incomeRecurrence,
                icon: 'attach_money',
                logoUrl: incomeFormData.logoUrl || undefined
            };

            if (editingIncomeId) {
                await updateSource(editingIncomeId, data);
                showSuccess('Income Updated', `${incomeFormData.name} has been updated.`);
            } else {
                await addSource(data);
                showSuccess('Income Added', `${incomeFormData.name} has been added to your income sources.`);
            }
            setIsIncomeModalOpen(false);
        } catch (error) {
            console.error("Failed to save income:", error);
            const errInfo = getErrorMessage(error);
            showError(errInfo.title, errInfo.message, errInfo.action ? {
                label: errInfo.action,
                onClick: () => handleSaveIncome() // Retry
            } : undefined);
        }
    };

    const handleDeleteIncome = async () => {
        if (editingIncomeId) {
            try {
                const incomeName = incomeFormData.name;
                await deleteSource(editingIncomeId);
                showSuccess('Income Deleted', `${incomeName} has been removed.`);
                setIsIncomeModalOpen(false);
            } catch (error) {
                console.error("Failed to delete income:", error);
                const errInfo = getErrorMessage(error);
                showError(errInfo.title, errInfo.message);
            }
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light text-slate-900 font-sans transition-colors duration-200">
            {/* Header */}
            <div className="sticky top-0 z-20 flex flex-col bg-background-light/95 backdrop-blur-md border-b border-white/40 transition-colors">
                <div className="flex items-center p-3 pb-1.5 justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="neo-btn flex size-8 shrink-0 items-center justify-center text-slate-800 rounded-full active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-base">arrow_back_ios_new</span>
                        </button>
                        <h1 className="text-base font-black leading-tight tracking-tight text-slate-900">Strategic Overview</h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {canEditBills && viewMode === 'bills' && bills.length > 0 && (
                            <button onClick={autoAssignBills} className="neo-btn px-2.5 py-1.5 flex items-center gap-1 rounded-full text-slate-500 hover:text-primary active:scale-95 transition-all bg-white shadow-sm border-slate-100">
                                <span className="material-symbols-outlined text-base">auto_fix_high</span>
                                <span className="text-[9px] font-black uppercase tracking-wide hidden sm:inline">Auto</span>
                            </button>
                        )}
                        {((viewMode === 'income' && isAdmin) || (viewMode === 'bills' && canEditBills)) && (
                            <button
                                onClick={() => viewMode === 'income' ? handleOpenIncomeModal() : handleOpenModal()}
                                className="neo-btn-primary px-3 py-1.5 flex items-center gap-1.5 rounded-full shadow-lg active:scale-95 transition-all text-white"
                            >
                                <span className="material-symbols-outlined text-base font-black">add</span>
                                <span className="text-[10px] font-black uppercase tracking-wide">{viewMode === 'income' ? 'Add Income' : 'Add Bill'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="px-2.5 pb-2.5">
                    <div className="neo-inset flex p-0.5 rounded-lg">
                        <button onClick={() => setViewMode('bills')} className={clsx("flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all", viewMode === 'bills' ? "neo-card bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <span className="material-symbols-outlined text-xs font-bold">receipt_long</span>
                            Bills
                        </button>
                        <button onClick={() => setViewMode('income')} className={clsx("flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all", viewMode === 'income' ? "neo-card bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <span className="material-symbols-outlined text-xs font-bold">attach_money</span>
                            Income
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex-1 p-3 md:p-5 pb-20 space-y-3">
                {viewMode === 'bills' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Collapsible Calendar Header */}
                        <button
                            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                            className="w-full flex items-center justify-between py-2 px-1 text-left group"
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-slate-400">calendar_month</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <span className={clsx(
                                "material-symbols-outlined text-lg text-slate-400 transition-transform duration-200",
                                isCalendarExpanded && "rotate-180"
                            )}>
                                expand_more
                            </span>
                        </button>

                        {/* Expandable Calendar Body */}
                        <div className={clsx(
                            "overflow-hidden transition-all duration-300 ease-out",
                            isCalendarExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                            <Calendar currentDate={currentDate} onDateChange={setCurrentDate} bills={bills} incomeSources={incomeSources} />
                        </div>

                        {bills.length === 0 ? (
                            /* Empty State - No Bills */
                            <div className="neo-card flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="neo-inset size-20 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-primary/60">receipt_long</span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Let's Get Started</h3>
                                <p className="text-xs text-slate-500 mb-6 max-w-[260px]">Add your recurring bills to see them on the calendar and track when they're due.</p>
                                {canEditBills && (
                                    <button
                                        onClick={() => handleOpenModal()}
                                        className="neo-btn-primary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">add</span>
                                            Add Your First Bill
                                        </span>
                                    </button>
                                )}
                                {!canEditBills && (
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                        Ask an Admin to add bills
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Monthly Progress Bar */}
                                {(() => {
                                    const paidTotal = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
                                    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
                                    const percent = totalAmount > 0 ? (paidTotal / totalAmount) * 100 : 0;
                                    const countPaid = bills.filter(b => b.status === 'paid').length;
                                    const countTotal = bills.length;

                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-end px-1">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Monthly Progress</p>
                                                <p className="text-[10px] font-black text-primary tracking-tighter">
                                                    {countPaid}/{countTotal} <span className="text-slate-300 mx-1">|</span> {Math.round(percent)}%
                                                </p>
                                            </div>
                                            <div className="h-2 w-full neo-inset rounded-full bg-slate-100 overflow-hidden p-0.5">
                                                <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${percent}%` }} />
                                            </div>
                                            <div className="flex justify-between px-1">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Settled: ${paidTotal.toLocaleString()}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total: ${totalAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Cycle-Based Bill Lists */}
                                {(() => {
                                    // Dynamically determine cycle for each bill (don't rely on stored value)
                                    const currentCycleBills = bills.filter(b => {
                                        if (b.status === 'paid') return false;
                                        const billCycle = determineBillCycle(b.dueDate);
                                        return billCycle === 'current';
                                    });
                                    
                                    const upcomingCycleBills = bills.filter(b => {
                                        if (b.status === 'paid') return false;
                                        const billCycle = determineBillCycle(b.dueDate);
                                        return billCycle === 'next';
                                    });
                                    
                                    // Further categorize current cycle bills by urgency
                                    const today = startOfDay(new Date());
                                    const overdueBills = currentCycleBills.filter(b => isPast(b.dueDate) && !isToday(b.dueDate));
                                    const dueSoonBills = currentCycleBills.filter(b => isToday(b.dueDate) || !isPast(b.dueDate));

                                    return (
                                        <>
                                            {/* Current Cycle Section */}
                                            <div className="space-y-1.5">
                                                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-t-xl flex items-center justify-between shadow-sm">
                                                    <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-base">event_available</span>
                                                        Current Cycle
                                                    </h3>
                                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold">{currentCycleBills.length} Bills</span>
                                                </div>
                                                <div className="bg-white rounded-b-xl shadow-lg border border-slate-100 overflow-hidden divide-y divide-slate-100 mt-0">
                                                    {overdueBills.length > 0 && (
                                                        <>
                                                            <div className="bg-red-50 px-3 py-1 border-b border-red-100">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-xs">warning</span>
                                                                    Overdue ({overdueBills.length})
                                                                </p>
                                                            </div>
                                                            {overdueBills.map(bill => (
                                                                <CompactBillCard
                                                                    key={bill.id}
                                                                    bill={bill}
                                                                    onClick={() => handleOpenModal(bill as any)}
                                                                    onPayClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsPaid(bill.id, bill.amount);
                                                                        showSuccess('Bill Paid', `${bill.name} marked as paid!`);
                                                                    }}
                                                                    onCommentClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDiscussingBillId(bill.id);
                                                                    }}
                                                                    commentCount={bill.comments?.length || 0}
                                                                />
                                                            ))}
                                                        </>
                                                    )}
                                                    
                                                    {dueSoonBills.length > 0 && (
                                                        <>
                                                            {overdueBills.length > 0 && (
                                                                <div className="bg-slate-50 px-3 py-1 border-b border-slate-100">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-xs">schedule</span>
                                                                        Due Soon ({dueSoonBills.length})
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {dueSoonBills.map(bill => (
                                                                <CompactBillCard
                                                                    key={bill.id}
                                                                    bill={bill}
                                                                    onClick={() => handleOpenModal(bill as any)}
                                                                    onPayClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsPaid(bill.id, bill.amount);
                                                                        showSuccess('Bill Paid', `${bill.name} marked as paid!`);
                                                                    }}
                                                                    onCommentClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDiscussingBillId(bill.id);
                                                                    }}
                                                                    commentCount={bill.comments?.length || 0}
                                                                />
                                                            ))}
                                                        </>
                                                    )}
                                                    
                                                    {currentCycleBills.length === 0 && (
                                                        <div className="p-10 flex flex-col items-center justify-center text-center">
                                                            <div className="neo-inset p-4 rounded-full mb-3">
                                                                <span className="material-symbols-outlined text-3xl text-blue-400">celebration</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-700 mb-1">All caught up!</p>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">No bills due this cycle</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Upcoming Cycle Section */}
                                            {upcomingCycleBills.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-t-xl flex items-center justify-between shadow-sm">
                                                        <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-base">event_upcoming</span>
                                                            Upcoming Cycle
                                                        </h3>
                                                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold">{upcomingCycleBills.length} Bills</span>
                                                    </div>
                                                    <div className="bg-white rounded-b-xl shadow-lg border border-slate-100 overflow-hidden divide-y divide-slate-100 mt-0">
                                                        {upcomingCycleBills.map(bill => (
                                                            <CompactBillCard
                                                                key={bill.id}
                                                                bill={bill}
                                                                onClick={() => handleOpenModal(bill as any)}
                                                                onPayClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsPaid(bill.id, bill.amount);
                                                                    showSuccess('Bill Paid', `${bill.name} marked as paid!`);
                                                                }}
                                                                onCommentClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDiscussingBillId(bill.id);
                                                                }}
                                                                commentCount={bill.comments?.length || 0}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                )}

                {viewMode === 'income' && (
                    <div className="space-y-4 animate-fade-in">
                        {incomeSources.sort((a, b) => new Date(a.nextPayday).getTime() - new Date(b.nextPayday).getTime()).map(source => (
                            <div key={source.id} onClick={() => handleOpenIncomeModal(source)} className="neo-card p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                <CompanyLogo name={source.name} customLogoUrl={source.logoUrl} size="md" fallbackIcon="payments" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-base text-slate-900 truncate">{source.name}</h4>
                                        <span className="font-black text-base text-emerald-600">
                                            {isAdmin ? `$${source.amount.toLocaleString()}` : '$---'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">{source.frequencyDisplay}</span>
                                            <span>Next: {new Date(source.nextPayday + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {incomeSources.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                                <div className="neo-inset p-4 rounded-full mb-3">
                                    <span className="material-symbols-outlined text-3xl">savings</span>
                                </div>
                                <p className="font-bold text-slate-600 mb-1">No income sources yet</p>
                                <button onClick={() => handleOpenIncomeModal()} className="neo-btn-primary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all">Add Income</button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bill Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm p-0 pb-20 sm:p-4 animate-fade-in">
                    <div className="neo-card w-full max-w-sm max-h-[90vh] overflow-y-auto transform transition-transform animate-slide-up sm:animate-none p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900">{modalMode === 'view' ? 'Bill Details' : (editingId ? 'Edit Bill' : 'New Bill')}</h2>
                            <div className="flex items-center gap-2">
                                {modalMode === 'view' && (
                                    <>
                                        <button onClick={() => setDiscussingBillId(editingId)} className="neo-btn rounded-full p-2 text-gray-500 hover:text-primary transition-colors"><span className="material-symbols-outlined">chat_bubble_outline</span></button>
                                        <button onClick={() => setModalMode('edit')} className="neo-btn rounded-full p-2 text-primary hover:text-primary/80"><span className="material-symbols-outlined">edit</span></button>
                                    </>
                                )}
                                <button onClick={() => setIsModalOpen(false)} className="neo-btn rounded-full p-2 text-gray-500"><span className="material-symbols-outlined">close</span></button>
                            </div>
                        </div>
                        {modalMode === 'view' ? (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl neo-inset">
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">${parseFloat(formData.amount).toFixed(2)}</p>
                                    <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-wider">{formData.companyName || formData.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="neo-card p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Frequency</span>
                                        <span className="text-sm font-bold text-slate-900 mt-1">{formData.frequency}</span>
                                    </div>
                                    <div className="neo-card p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Due Date</span>
                                        <span className="text-sm font-bold text-slate-900 mt-1">Day {formData.dueDay}</span>
                                    </div>
                                </div>
                                {(formData.username || formData.accountNumber) && (
                                    <div className="neo-inset p-4 rounded-2xl space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-primary text-lg">lock</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shared Credentials</span>
                                        </div>
                                        {formData.accountNumber && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-bold uppercase tracking-tighter">Acct #</span>
                                                <span className="font-mono font-bold text-slate-900 select-all">{formData.accountNumber}</span>
                                            </div>
                                        )}
                                        {formData.username && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-bold uppercase tracking-tighter">User</span>
                                                <span className="font-mono font-bold text-slate-900 select-all">{formData.username}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Name & Amount */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="neo-inset w-full p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none"
                                            placeholder="e.g., Electric, Netflix..."
                                            disabled={!canEditBills}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                className="neo-inset w-full p-3.5 pl-8 rounded-xl text-slate-900 text-sm font-bold focus:outline-none"
                                                placeholder="0.00"
                                                disabled={!canEditBills}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bill Frequency - Simple Visual Selection */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">How Often Is This Bill?</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'monthly', label: 'Monthly', desc: 'Most common', icon: 'calendar_month' },
                                            { id: 'bimonthly', label: 'Every 2 Mo', desc: 'Water/Sewer', icon: 'water_drop' },
                                            { id: 'quarterly', label: 'Quarterly', desc: 'Every 3 mo', icon: 'date_range' },
                                            { id: 'semiannual', label: '6 Months', desc: 'Car Insurance', icon: 'directions_car' },
                                            { id: 'annual', label: 'Yearly', desc: 'Annual', icon: 'event' },
                                            { id: 'weekly', label: 'Weekly', desc: 'Every week', icon: 'calendar_view_week' }
                                        ].map((freq) => (
                                            <button
                                                key={freq.id}
                                                type="button"
                                                onClick={() => {
                                                    if (!canEditBills) return;
                                                    setFormData({ ...formData, frequency: freq.label });
                                                    const rules: Record<string, { rule: RecurrenceRule, summary: string, dueDay?: number }> = {
                                                        monthly: { rule: { type: 'monthly', byMonthDay: formData.dueDay }, summary: `Monthly on day ${formData.dueDay}` },
                                                        bimonthly: { rule: { type: 'custom', interval: 2, unit: 'month' }, summary: 'Every 2 months' },
                                                        quarterly: { rule: { type: 'custom', interval: 3, unit: 'month' }, summary: 'Every 3 months' },
                                                        semiannual: { rule: { type: 'custom', interval: 6, unit: 'month' }, summary: 'Every 6 months' },
                                                        annual: { rule: { type: 'yearly' }, summary: 'Annually' },
                                                        weekly: { rule: { type: 'weekly' }, summary: 'Weekly' }
                                                    };
                                                    setRecurrence(rules[freq.id].rule);
                                                    setRecurrenceSummary(rules[freq.id].summary);
                                                }}
                                                className={clsx(
                                                    "flex flex-col items-center gap-0.5 p-2.5 rounded-xl border-2 transition-all",
                                                    formData.frequency === freq.label
                                                        ? "border-primary bg-primary/5"
                                                        : "border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                <span className={clsx(
                                                    "material-symbols-outlined text-lg",
                                                    formData.frequency === freq.label ? "text-primary" : "text-slate-400"
                                                )}>{freq.icon}</span>
                                                <span className={clsx(
                                                    "text-[10px] font-bold leading-tight",
                                                    formData.frequency === freq.label ? "text-primary" : "text-slate-700"
                                                )}>{freq.label}</span>
                                                <span className="text-[8px] text-slate-400 leading-none">{freq.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Day of Month - Only show for monthly/bimonthly/quarterly bills */}
                                {['Monthly', 'Every 2 Mo', 'Quarterly', '6 Months', 'Yearly'].includes(formData.frequency) && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Day of Month</label>
                                        <div className="grid grid-cols-7 gap-1.5 p-1">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    disabled={!canEditBills}
                                                    onClick={() => {
                                                        setFormData({ ...formData, dueDay: day });
                                                        setRecurrence({ ...recurrence, byMonthDay: day });
                                                        setRecurrenceSummary(recurrenceSummary.replace(/day \d+/, `day ${day}`));
                                                    }}
                                                    className={clsx(
                                                        "aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
                                                        formData.dueDay === day
                                                            ? "bg-primary text-white shadow-md scale-110 ring-2 ring-primary/20"
                                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Owner Selection - Only show in multi-user mode */}
                                {!isSoloMode && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned To</label>
                                        <div className="neo-inset px-3 rounded-xl">
                                            <select
                                                value={formData.owner}
                                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                                disabled={!canEditBills}
                                                className="w-full py-3.5 text-slate-900 text-sm font-bold bg-transparent border-none focus:outline-none disabled:opacity-50"
                                            >
                                                <option value="Joint">Joint (Everyone)</option>
                                                {members.filter(m => m.status === 'active').map(member => (
                                                    <option key={member.id} value={member.name}>{member.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Tentative Toggle */}
                                <div className="flex items-center justify-between p-3.5 rounded-xl neo-inset bg-slate-50/50">
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Tentative Bill</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">I'm not sure if I'll pay this yet</p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={!canEditBills}
                                        onClick={() => setFormData({ ...formData, isTentative: !formData.isTentative })}
                                        className={clsx("w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center disabled:opacity-50", formData.isTentative ? "bg-primary shadow-inner" : "bg-slate-200")}
                                    >
                                        <div className={clsx("size-4 bg-white rounded-full shadow-sm transition-transform duration-300", formData.isTentative ? "translate-x-6" : "translate-x-0")} />
                                    </button>
                                </div>
                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        disabled={!canEditBills}
                                        className="neo-inset w-full p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none disabled:opacity-50"
                                        placeholder="Company Name"
                                    />

                                    {/* Icon Picker */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Icon</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['💡', '💧', '🔥', '📶', '🏠', '🚗', '💳', '🏥', '🎬', '📦', '🛒', '📄', '🏦', '🎓', '💪', '🐾', '👶', '✈️'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    disabled={!canEditBills}
                                                    onClick={() => setFormData({ ...formData, logoUrl: emoji })}
                                                    className={clsx(
                                                        "size-9 rounded-lg flex items-center justify-center text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                                        formData.logoUrl === emoji
                                                            ? "bg-primary/20 ring-2 ring-primary scale-110"
                                                            : "bg-slate-100 hover:bg-slate-200"
                                                    )}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                        disabled={!canEditBills}
                                        className="neo-inset w-full p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none disabled:opacity-50"
                                        placeholder="Account Number"
                                    />
                                    <input
                                        type="url"
                                        value={formData.paymentUrl}
                                        onChange={(e) => setFormData({ ...formData, paymentUrl: e.target.value })}
                                        disabled={!canEditBills}
                                        className="neo-inset w-full p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none disabled:opacity-50"
                                        placeholder="Payment URL (e.g., https://pay.company.com)"
                                    />
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        disabled={!canEditBills}
                                        className="neo-inset w-full p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none resize-none h-24 disabled:opacity-50"
                                        placeholder="Notes..."
                                    ></textarea>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    {editingId && (
                                        <button
                                            onClick={handleDeleteBill}
                                            disabled={!isAdmin} // Only Admins can delete
                                            className="neo-btn px-5 py-3 rounded-xl text-red-500 font-black uppercase tracking-widest hover:bg-red-50 text-[10px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Eliminate
                                        </button>
                                    )}
                                    {canEditBills && (
                                        <button onClick={handleSaveBill} className="neo-btn-primary flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all text-white">
                                            Confirm Bill
                                        </button>
                                    )}
                                    {!canEditBills && (
                                        <button disabled className="neo-btn bg-slate-100 flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 cursor-not-allowed">
                                            View Only Mode
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Income Modal - Simplified */}
            {isIncomeModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm p-0 pb-20 sm:p-4 animate-fade-in">
                    <div className="neo-card w-full max-w-sm max-h-[90vh] overflow-y-auto transform transition-transform animate-slide-up sm:animate-none p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{editingIncomeId ? 'Edit Income' : 'Add Income'}</h2>
                                <p className="text-xs text-slate-500">When do you get paid?</p>
                            </div>
                            <button onClick={() => setIsIncomeModalOpen(false)} className="neo-btn rounded-full p-2 text-gray-500"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="space-y-5">
                            {/* Name & Amount */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Income Name</label>
                                    <input
                                        type="text"
                                        value={incomeFormData.name}
                                        onChange={(e) => setIncomeFormData({ ...incomeFormData, name: e.target.value })}
                                        className="neo-inset w-full p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none"
                                        placeholder="e.g., My Salary, Freelance..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount Per Paycheck</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <input
                                            type={isAdmin ? "number" : "text"}
                                            value={isAdmin ? incomeFormData.amount : '---'}
                                            onChange={(e) => isAdmin && setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                                            disabled={!isAdmin}
                                            className="neo-inset w-full p-3.5 pl-8 rounded-xl text-slate-900 text-sm font-bold focus:outline-none disabled:opacity-60"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pay Frequency - Simple Visual Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">How Often Do You Get Paid?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'biweekly', label: 'Every 2 Weeks', desc: 'Most common', icon: 'event_repeat' },
                                        { id: 'weekly', label: 'Weekly', desc: 'Every week', icon: 'calendar_view_week' },
                                        { id: 'semimonthly', label: '1st & 15th', desc: 'Twice monthly', icon: 'calendar_today' },
                                        { id: 'monthly', label: 'Monthly', desc: 'Once a month', icon: 'calendar_month' }
                                    ].map((freq) => (
                                        <button
                                            key={freq.id}
                                            type="button"
                                            disabled={!isAdmin}
                                            onClick={() => {
                                                setIncomeFormData({ ...incomeFormData, frequencyDisplay: freq.label });
                                                const rules: Record<string, { rule: RecurrenceRule, summary: string }> = {
                                                    biweekly: { rule: { type: 'custom', interval: 2, unit: 'week' }, summary: 'Every 2 weeks' },
                                                    weekly: { rule: { type: 'weekly' }, summary: 'Weekly' },
                                                    semimonthly: { rule: { type: 'monthly', byMonthDay: 1 }, summary: '1st & 15th of each month' },
                                                    monthly: { rule: { type: 'monthly', byMonthDay: 1 }, summary: 'Monthly' }
                                                };
                                                setIncomeRecurrence(rules[freq.id].rule);
                                                setIncomeRecurrenceSummary(rules[freq.id].summary);
                                            }}
                                            className={clsx(
                                                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                                incomeFormData.frequencyDisplay === freq.label
                                                    ? "border-primary bg-primary/5"
                                                    : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <span className={clsx(
                                                "material-symbols-outlined text-xl",
                                                incomeFormData.frequencyDisplay === freq.label ? "text-primary" : "text-slate-400"
                                            )}>{freq.icon}</span>
                                            <span className={clsx(
                                                "text-xs font-bold",
                                                incomeFormData.frequencyDisplay === freq.label ? "text-primary" : "text-slate-700"
                                            )}>{freq.label}</span>
                                            <span className="text-[9px] text-slate-400">{freq.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Next Payday - Day of Month Grid */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Next Payday (Day of Month)</label>
                                <div className="grid grid-cols-7 gap-1.5 p-1">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            disabled={!isAdmin}
                                            onClick={() => {
                                                setIncomeFormData({ ...incomeFormData, dueDay: day });
                                            }}
                                            className={clsx(
                                                "aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
                                                incomeFormData.dueDay === day
                                                    ? "bg-emerald-600 text-white shadow-md scale-110 ring-2 ring-emerald-600/20"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Icon</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {['💰', '💵', '💳', '💼', '🏢', '💻', '📈', '🏦', '🏠', '🎁', '🏛️', '🎯', '🚗', '📦', '🎓', '🏖️'].map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            disabled={!isAdmin}
                                            onClick={() => setIncomeFormData({ ...incomeFormData, logoUrl: emoji })}
                                            className={clsx(
                                                "size-9 rounded-lg flex items-center justify-center text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                                incomeFormData.logoUrl === emoji
                                                    ? "bg-primary/20 ring-2 ring-primary scale-110"
                                                    : "bg-slate-100 hover:bg-slate-200"
                                            )}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-6">
                            {editingIncomeId && (
                                <button
                                    onClick={handleDeleteIncome}
                                    disabled={!isAdmin}
                                    className="neo-btn p-4 rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={handleSaveIncome}
                                    disabled={!incomeFormData.name || !incomeFormData.amount}
                                    className={clsx(
                                        "flex-1 p-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all",
                                        incomeFormData.name && incomeFormData.amount
                                            ? "neo-btn-primary text-white active:scale-95"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    {editingIncomeId ? 'Save Changes' : 'Add Income'}
                                </button>
                            )}
                            {!isAdmin && (
                                <button disabled className="neo-btn bg-slate-100 flex-1 p-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 cursor-not-allowed">
                                    Admin Only
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <CommentModal isOpen={!!discussingBill} onClose={() => setDiscussingBillId(null)} title={discussingBill?.name || 'Bill'} comments={discussingBill?.comments || []} onAddComment={handleAddComment} />
            <RepeatPicker isOpen={isRepeatPickerOpen} onClose={() => setIsRepeatPickerOpen(false)} value={recurrence} referenceDate={new Date()} onChange={(rule, summary) => { setRecurrence(rule); setRecurrenceSummary(summary); }} />
            <RepeatPicker isOpen={isIncomeRepeatPickerOpen} onClose={() => setIsIncomeRepeatPickerOpen(false)} value={incomeRecurrence} referenceDate={new Date(incomeFormData.nextPayday)} onChange={(rule, summary) => { setIncomeRecurrence(rule); setIncomeRecurrenceSummary(summary); }} />
        </div>
    );
}