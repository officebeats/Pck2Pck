import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import CommentModal, { Comment } from '../components/CommentModal';
import { useIncomeSources } from '@/hooks/useIncomeSources';

import { useBills, Bill as FirestoreBill } from '@/hooks/useBills';

import { useAuth } from '@/context/AuthContext';
import { getNextOccurrences } from '@/lib/recurrence';
import { useToast, getErrorMessage } from '@/components/Toast';
import CompanyLogo from '@/components/CompanyLogo';
import CompactBillCard from '@/components/CompactBillCard';
import { format } from 'date-fns';
import { useGroup } from '@/hooks/useGroup';

// --- Interfaces ---

/** Represents a Bill in the dashboard view */
// Using the Firestore interface, but extending/adapting if needed.
type Bill = FirestoreBill;

interface TimerProps {
    targetDate: Date;
    status: string;
}

// --- Components ---

/**
 * CountdownTimer Component
 * Displays the time remaining until a bill is due.
 */
const CountdownTimer = ({ targetDate, status }: TimerProps) => {
    const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = targetDate.getTime();
            let diff = target - now;

            if (status === 'overdue') {
                diff = now - target;
            }

            if (diff < 0) diff = 0;

            setTimeLeft({
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / 1000 / 60) % 60),
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute to save resources
        return () => clearInterval(timer);
    }, [targetDate, status]);

    if (!timeLeft) return null;

    const isOverdue = status === 'overdue';

    return (
        <div className={clsx(
            "flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest animate-fade-in",
            isOverdue ? "text-red-700" : "text-orange-700"
        )}>
            <span className="material-symbols-outlined text-sm mb-[1px] animate-pulse">
                {isOverdue ? 'warning' : 'timer'}
            </span>
            <span className="truncate">
                {isOverdue ? 'OVERDUE: ' : ''}{timeLeft.d}d {timeLeft.h.toString().padStart(2, '0')}h {timeLeft.m.toString().padStart(2, '0')}m
            </span>
        </div>
    );
};

export default function Home() {
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const { bills, loading, markAsPaid, updateBill } = useBills();
    const { sources } = useIncomeSources();
    const { canEditBills, isAdmin } = useGroup();

    // --- Constants ---
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // --- State ---
    const [currentBalance, setCurrentBalance] = useState(2450.00);
    const [viewingDetailsBillId, setViewingDetailsBillId] = useState<string | null>(null);
    const [confirmingBillId, setConfirmingBillId] = useState<string | null>(null);
    const [actualPayAmount, setActualPayAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPaydayModal, setShowPaydayModal] = useState(false);
    const [paydayConfirmationText, setPaydayConfirmationText] = useState('');
    const [discussingBillId, setDiscussingBillId] = useState<string | null>(null);

    // --- Derived State (Logic) ---

    const unpaidBills = useMemo(() => bills.filter(b => b.status !== 'paid'), [bills]);

    const currentCycleBills = useMemo(() => {
        return bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate >= startOfMonth && dueDate <= endOfMonth;
        });
    }, [bills, startOfMonth, endOfMonth]);

    const sortedBills = useMemo(() => {
        return [...currentCycleBills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [currentCycleBills]);

    const projectedIncome = useMemo(() => {
        return sources.reduce((acc, source) => acc + source.amount, 0);
    }, [sources]);

    const totalCycleAmount = useMemo(() => {
        return currentCycleBills.reduce((acc, b) => acc + b.amount, 0);
    }, [currentCycleBills]);

    const paidCycleAmount = currentCycleBills.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.amount, 0);
    const percentPaid = totalCycleAmount > 0 ? (paidCycleAmount / totalCycleAmount) * 100 : 0;
    const remainingBillCount = currentCycleBills.filter(b => b.status !== 'paid').length;

    const safeToSpend = projectedIncome - totalCycleAmount;
    const isPositive = safeToSpend >= 0;

    // Fix for masked variables
    const safeSpendMonthly = safeToSpend;
    const daysRemainingInMonth = endOfMonth.getDate() - today.getDate() + 1;
    const safeSpendDaily = safeSpendMonthly > 0 ? safeSpendMonthly / Math.max(1, daysRemainingInMonth) : 0;

    const daysUntilPayday = useMemo(() => {
        if (sources.length === 0) return null;

        // Find the earliest next payday
        const dates = sources.map(s => new Date(s.nextPayday).getTime());
        const minDate = Math.min(...dates);

        // Calculate difference
        const diffTime = Math.abs(minDate - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Note: Logic might need refinement for "today" vs "future", but basic diff is fine for now.
        // Better:
        const nextPayday = new Date(minDate);
        const difference = Math.ceil((nextPayday.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return difference > 0 ? difference : 0;
    }, [sources]);

    const billToPay = bills.find(b => b.id === confirmingBillId);
    const detailsBill = bills.find(b => b.id === viewingDetailsBillId);
    const discussingBill = bills.find(b => b.id === discussingBillId);

    // Calculate difference between expected and actual paid amount
    const diffData = useMemo(() => {
        if (!billToPay || !actualPayAmount) return null;
        const expected = billToPay.amount;
        const actual = parseFloat(actualPayAmount);
        if (isNaN(actual)) return null;
        const diff = actual - expected;
        const percent = expected !== 0 ? (diff / expected) * 100 : 0;
        return { diff, percent };
    }, [billToPay, actualPayAmount]);

    // --- Handlers ---

    const handlePayClick = (e: React.MouseEvent, bill: Bill) => {
        e.stopPropagation();
        setConfirmingBillId(bill.id);
        setActualPayAmount(bill.amount.toFixed(2));
    };

    const confirmPayment = async () => {
        if (!confirmingBillId) return;
        setIsProcessing(true);

        const bill = bills.find(b => b.id === confirmingBillId);
        const billName = bill?.name || 'Bill';

        try {
            await markAsPaid(confirmingBillId, parseFloat(actualPayAmount) || 0);
            setCurrentBalance(prev => prev - (parseFloat(actualPayAmount) || 0));
            showSuccess('Bill Paid', `${billName} has been marked as paid.`);
            setConfirmingBillId(null);
            setActualPayAmount('');
        } catch (error) {
            console.error("Failed to pay bill:", error);
            const errInfo = getErrorMessage(error);
            showError(errInfo.title, errInfo.message, errInfo.action ? {
                label: errInfo.action,
                onClick: () => confirmPayment()
            } : undefined);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPayday = async () => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
        setCurrentBalance(prev => prev + 2250.00); // Simulate income
        setIsProcessing(false);
        setShowPaydayModal(false);
        setPaydayConfirmationText('');
    };

    const handleAddComment = async (text: string) => {
        if (!discussingBillId) return;

        // Find current bill to get existing comments
        const bill = bills.find(b => b.id === discussingBillId);
        if (!bill) return;

        const newComment: Comment = {
            id: Date.now(),
            user: 'You',
            text,
            timestamp: 'Just now',
            isMe: true
        };

        // Update Firestore
        try {
            const updatedComments = [...(bill.comments || []), newComment];
            await updateBill(discussingBillId, { comments: updatedComments });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root text-slate-900 bg-background-light transition-colors duration-200">

            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row md:items-center bg-background-light/90 backdrop-blur-md p-3 pb-1.5 justify-between sticky top-0 z-20 border-b border-white/40 transition-colors duration-200 md:p-5 md:pb-0 gap-2">
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h1 className="text-slate-900 text-base md:text-xl font-black leading-tight tracking-tight">Home</h1>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {daysUntilPayday !== null ? `${daysUntilPayday} Days to Payday` : 'No upcoming payday'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPaydayModal(true)}
                            className="neo-btn-primary px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-all hover:brightness-110 active:scale-95 shadow-md"
                        >
                            <span className="material-symbols-outlined text-base">attach_money</span>
                            <span className="hidden sm:inline">Confirm Payday Paycheck</span>
                        </button>
                        <div className="md:hidden">
                            <button className="neo-btn flex items-center justify-center rounded-full h-9 w-9 text-slate-900 shadow-sm">
                                <span className="material-symbols-outlined text-lg">person</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 p-3 pt-3 md:p-5 space-y-2">

                {/* FTUE: First Time User Experience - Prompt to add income first */}
                {sources.length === 0 && (
                    <div className="neo-card p-6 bg-gradient-to-br from-primary/5 to-emerald-50 border-2 border-primary/20 animate-fade-in">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-primary">waving_hand</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 mb-1">Welcome to pchk2PCHK!</h2>
                                <p className="text-sm text-slate-600 max-w-[280px]">
                                    Let's get you set up. First, tell us when you get paid so we can help you plan your bills.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/planning?view=income')}
                                className="neo-btn-primary px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                                Add Your Income
                            </button>
                            <p className="text-[10px] text-slate-400 font-medium">Takes less than 30 seconds</p>
                        </div>
                    </div>
                )}

                {/* Main Dashboard Content - Only show when setup is complete */}
                {sources.length > 0 && (
                    <>
                        {/* Safe To Spend Hero Card */}
                        <div className="neo-card p-4 relative overflow-hidden group bg-white shadow-lg border-none ring-1 ring-slate-100">
                            <div className="flex flex-col items-center justify-center text-center gap-1 mb-4 z-10 relative">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">account_balance_wallet</span>
                                    Left to Spend
                                </p>
                                <div className={clsx("text-4xl font-black leading-none tracking-tighter transition-colors", isPositive ? "text-slate-900" : "text-red-500")}>
                                    {isAdmin ? (
                                        <>
                                            {safeToSpend < 0 ? '-' : ''}${Math.abs(safeToSpend).toLocaleString()}
                                        </>
                                    ) : (
                                        <span className="text-slate-300">$---</span>
                                    )}
                                </div>
                                <p className={clsx("text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full mt-1", isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                                    {isPositive ? 'On Track' : 'Over Budget'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                                <div
                                    onClick={() => navigate('/planning?view=income')}
                                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl cursor-pointer hover:bg-emerald-50/50 active:scale-95 transition-all"
                                >
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <span className="material-symbols-outlined text-xs">trending_up</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Income</span>
                                    </div>
                                    <span className="text-sm font-black text-emerald-600 tracking-tight">
                                        {isAdmin ? `+$${projectedIncome.toLocaleString()}` : '+$---'}
                                    </span>
                                </div>
                                <div
                                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl"
                                >
                                    <div className="flex items-center gap-1 text-red-500">
                                        <span className="material-symbols-outlined text-xs"> trending_down </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Bills</span>
                                    </div>
                                    <span className="text-sm font-black text-red-500 tracking-tight">-${totalCycleAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cycle Control Row */}
                        <div className="flex items-center gap-2">
                            <div className="neo-card flex-1 px-3 py-2 flex items-center justify-between bg-white shadow-sm border-none ring-1 ring-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">calendar_today</span>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Cycle</p>
                                        <p className="text-xs font-black text-slate-900">{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                            {canEditBills && (
                                <button
                                    onClick={() => navigate('/planning')}
                                    className="neo-btn-primary h-full aspect-square flex items-center justify-center rounded-xl shadow-sm active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-xl">add</span>
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
                            <div
                                className={clsx("h-full transition-all duration-1000", isPositive ? "bg-emerald-500" : "bg-red-500")}
                                style={{ width: `${Math.min(percentPaid, 100)}%` }}
                            ></div>
                        </div>

                        {/* --- Priority To-Pay --- */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[9px] font-black text-slate-500 flex items-center gap-1.5 uppercase tracking-[0.2em]">
                                    <span className="material-symbols-outlined text-primary text-xs font-bold">priority_high</span>
                                    Up Next
                                </h3>
                            </div>

                            <div className="flex flex-col gap-2">
                                {sortedBills.length === 0 ? (
                                    <div className="neo-inset flex flex-col items-center justify-center py-8 px-6 rounded-xl border border-dashed border-gray-300">
                                        <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                                        <h3 className="text-green-500 font-bold text-sm">You're all set!</h3>
                                        <p className="text-xs text-slate-600 text-center max-w-[200px]">No pending bills found. Enjoy your financial freedom.</p>
                                        <button onClick={() => navigate('/bills')} className="mt-3 text-primary text-xs font-bold hover:underline">View All Bills</button>
                                    </div>
                                ) : (
                                    sortedBills.map((bill) => (
                                        <CompactBillCard
                                            key={bill.id}
                                            bill={bill}
                                            onClick={() => setViewingDetailsBillId(bill.id)}
                                            onPayClick={(e) => handlePayClick(e, bill)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )
                }

            </main >

            {/* --- Single Bill Modal (Shared Details) --- */}
            {
                detailsBill && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="neo-card w-full max-w-sm overflow-hidden p-6 animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto no-scrollbar">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <CompanyLogo name={detailsBill.name} companyName={detailsBill.companyName} size="lg" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{detailsBill.name}</h3>
                                            <span className={clsx(
                                                "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                                                detailsBill.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {detailsBill.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{detailsBill.companyName || 'Subscription'}</p>
                                            <span className="text-slate-200">•</span>
                                            <p className="text-primary text-[10px] font-black uppercase tracking-widest">{detailsBill.category}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => { setDiscussingBillId(detailsBill.id); }} className="neo-btn rounded-full p-2 text-gray-500 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
                                    </button>
                                    <button onClick={() => setViewingDetailsBillId(null)} className="neo-btn rounded-full p-2">
                                        <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-6 mb-6 bg-slate-50 rounded-2xl neo-inset">
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">${detailsBill.amount.toFixed(2)}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">{detailsBill.companyName || 'Bill Details'}</p>
                            </div>

                            <div className="space-y-5">
                                {/* Core Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="neo-card p-3 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</span>
                                        <span className="font-bold text-slate-800 text-sm mt-1">{new Date(detailsBill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="neo-card p-3 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paycheck</span>
                                        <span className="font-bold text-slate-800 text-sm mt-1">{detailsBill.paycheckLabel}</span>
                                    </div>
                                </div>

                                {detailsBill.website && (
                                    <a href={detailsBill.website} target="_blank" rel="noopener noreferrer" className="neo-btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm">
                                        <span>Go to Bill Site</span>
                                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    </a>
                                )}

                                {/* Shared Creds */}
                                <div className="neo-inset p-4 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-symbols-outlined text-primary text-lg font-bold">lock</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Shared Details</span>
                                    </div>

                                    {detailsBill.accountNumber && (
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Account #</p>
                                            <p className="font-mono font-bold text-slate-900 select-all tracking-tight">{detailsBill.accountNumber}</p>
                                        </div>
                                    )}

                                    {(detailsBill.username || detailsBill.password) && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {detailsBill.username && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Username</p>
                                                    <p className="font-mono text-xs font-bold text-slate-900 select-all truncate">{detailsBill.username}</p>
                                                </div>
                                            )}
                                            {detailsBill.password && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Password</p>
                                                    <p className="font-mono text-xs font-bold text-slate-900 select-all truncate">{detailsBill.password}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!detailsBill.accountNumber && !detailsBill.username && !detailsBill.password && (
                                        <p className="text-xs text-slate-400 italic text-center py-2">No credentials shared yet.</p>
                                    )}
                                </div>

                                {detailsBill.notes && (
                                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                                        <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Shared Notes</p>
                                        <p className="text-sm text-slate-700 italic">"{detailsBill.notes}"</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => navigate('/planning')}
                                        className="neo-btn flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
                                    >
                                        Edit
                                    </button>
                                    {detailsBill.status !== 'paid' && (
                                        <button
                                            onClick={(e) => {
                                                setViewingDetailsBillId(null);
                                                handlePayClick(e, detailsBill);
                                            }}
                                            className="neo-btn-primary flex-1 py-3 rounded-xl font-bold shadow-lg"
                                        >
                                            Pay Bill
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirm Pay Modal */}
            {
                billToPay && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="neo-card w-full max-w-sm overflow-hidden transform transition-all scale-100 p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <CompanyLogo name={billToPay.name} companyName={billToPay.companyName} size="lg" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">{billToPay.name}</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Confirm Bill Payment</p>
                                </div>
                            </div>

                            <div className="mb-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Amount</label>
                                    <p className="text-xl font-black text-slate-900">${billToPay.amount.toFixed(2)}</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actual Amount Paid</label>
                                    <div className="neo-inset p-1 rounded-xl">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={actualPayAmount}
                                            onChange={(e) => setActualPayAmount(e.target.value)}
                                            className="w-full p-2 bg-transparent text-lg font-black text-gray-900 focus:outline-none text-center"
                                        />
                                    </div>
                                </div>

                                {diffData && diffData.diff !== 0 && (
                                    <div className={clsx(
                                        "flex items-center gap-2 text-sm font-bold p-3 rounded-lg animate-fade-in",
                                        diffData.diff > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                    )}>
                                        <span className="material-symbols-outlined text-lg">
                                            {diffData.diff > 0 ? 'trending_up' : 'trending_down'}
                                        </span>
                                        <span>
                                            {diffData.diff > 0 ? '+' : ''}{diffData.diff.toFixed(2)} ({diffData.diff > 0 ? '+' : ''}{diffData.percent.toFixed(1)}%)
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => !isProcessing && setConfirmingBillId(null)}
                                    disabled={isProcessing}
                                    className="neo-btn flex-1 px-4 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    disabled={isProcessing || !actualPayAmount}
                                    className="neo-btn-primary flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    {isProcessing ? (
                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                    ) : (
                                        'Confirm'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Payday Modal */}
            {
                showPaydayModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
                        <div className="neo-card w-full max-w-md overflow-hidden transform transition-all scale-100 p-0 border-2 border-slate-200">
                            <div className="bg-emerald-500 p-6 text-white text-center relative overflow-hidden">
                                <span className="material-symbols-outlined text-9xl absolute -bottom-8 -right-8 opacity-20 rotate-12">payments</span>
                                <h2 className="text-2xl font-black uppercase tracking-widest relative z-10 text-shadow-sm">Process Payday</h2>
                                <p className="text-emerald-50 text-xs font-bold uppercase tracking-wider relative z-10 mt-1">Clear the board and relax.</p>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1 text-center">
                                        Type "i got paid" to confirm
                                    </label>
                                    <div className="neo-inset p-1.5 rounded-2xl bg-white">
                                        <input
                                            type="text"
                                            className="w-full p-4 text-center font-black text-xl text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent uppercase tracking-wider"
                                            placeholder="I GOT PAID"
                                            value={paydayConfirmationText}
                                            onChange={(e) => setPaydayConfirmationText(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <button onClick={handleConfirmPayday} disabled={paydayConfirmationText.toLowerCase() !== 'i got paid' || isProcessing} className="neo-btn-primary w-full h-14 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                                        {isProcessing ? (
                                            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">check_circle</span>
                                                <span>Confirm Receipt</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="mt-4 text-center">
                                    <button onClick={() => setShowPaydayModal(false)} disabled={isProcessing} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abort Sequence</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Comment Modal */}
            <CommentModal
                isOpen={!!discussingBill}
                onClose={() => setDiscussingBillId(null)}
                title={discussingBill?.name || 'Bill'}
                comments={discussingBill?.comments || []}
                onAddComment={handleAddComment}
            />
        </div >
    );
}