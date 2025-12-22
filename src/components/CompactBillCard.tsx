import React from 'react';
import clsx from 'clsx';
import CompanyLogo from './CompanyLogo';
import { Bill } from '@/hooks/useBills';
import { differenceInCalendarDays, parseISO, isPast, isToday } from 'date-fns';

interface CompactBillCardProps {
    bill: any; // Using any to handle both Firestore Bill and UIBill from Planning.tsx
    onClick?: () => void;
    onPayClick?: (e: React.MouseEvent) => void;
}

/**
 * CompactBillCard Component
 * Inspired by professional financial management apps.
 * Provides a high-density, status-aware view of a bill.
 */
export const CompactBillCard: React.FC<CompactBillCardProps> = ({ bill, onClick, onPayClick }) => {
    const dueDate = bill.dueDate instanceof Date ? bill.dueDate : parseISO(bill.dueDateIso || bill.dueDate);
    const today = new Date();
    const daysRemaining = differenceInCalendarDays(dueDate, today);

    // Status logic
    const isOverdue = isPast(dueDate) && !isToday(dueDate);
    const isDueToday = isToday(dueDate);

    // Urgency level for color coding
    const urgency = isOverdue || isDueToday ? 'critical' : daysRemaining <= 3 ? 'warning' : 'stable';

    const statusConfig = {
        critical: {
            badge: 'bg-red-500',
            text: 'text-red-600',
            bg: 'bg-red-50/30',
            border: 'border-red-100',
            label: isOverdue ? `${Math.abs(daysRemaining)}d overdue` : 'Due Today'
        },
        warning: {
            badge: 'bg-amber-500',
            text: 'text-amber-600',
            bg: 'bg-amber-50/30',
            border: 'border-amber-100',
            label: `Due in ${daysRemaining}d`
        },
        stable: {
            badge: 'bg-emerald-500',
            text: 'text-emerald-500',
            bg: 'bg-slate-50/30',
            border: 'border-slate-100',
            label: `${daysRemaining}d left`
        }
    }[urgency];

    return (
        <div
            onClick={onClick}
            className={clsx(
                "relative group flex items-center gap-2 p-2 pl-3 rounded-xl transition-all duration-200 cursor-pointer",
                "bg-white border hover:shadow-md active:scale-[0.99]",
                statusConfig.border,
                onClick && "hover:border-primary/30"
            )}
        >
            {/* Status Indicator Bar (Left Edge) */}
            <div className={clsx(
                "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-300 group-hover:w-1.5",
                statusConfig.badge
            )} />

            {/* Logo Section */}
            <div className="shrink-0">
                <CompanyLogo
                    name={bill.name}
                    companyName={bill.companyName}
                    size="sm"
                    className="shadow-sm scale-90 origin-left"
                />
            </div>

            {/* Main Info Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-black text-sm text-slate-900 truncate tracking-tight uppercase">
                        {bill.name}
                    </h4>
                    <span className="font-black text-sm text-slate-900 tabular-nums">
                        ${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className={clsx(
                            "text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
                            statusConfig.text
                        )}>
                            {statusConfig.label}
                        </span>
                        <span className="text-slate-300 text-[9px]">•</span>
                        <span className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-tighter">
                            {bill.category}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Action Button */}
            {onPayClick && bill.status !== 'paid' && (
                <button
                    onClick={onPayClick}
                    className={clsx(
                        "ml-1 h-7 px-3 rounded-md font-black text-[9px] uppercase tracking-widest transition-all active:scale-90 shadow-sm border",
                        urgency === 'critical'
                            ? "bg-red-600 text-white border-red-700 hover:bg-red-700"
                            : "neo-btn-primary py-0"
                    )}
                >
                    Pay
                </button>
            )}
        </div>
    );
};

export default CompactBillCard;
