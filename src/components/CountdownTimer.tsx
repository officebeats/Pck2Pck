import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface CountdownTimerProps {
    targetDate: Date | string;
    className?: string;
    showIcon?: boolean;
    compact?: boolean;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
    totalSeconds: number;
}

/**
 * CountdownTimer Component
 * Displays a live countdown (to the second) until a target date
 * Updates every second for real-time accuracy
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
    targetDate, 
    className = '',
    showIcon = true,
    compact = false
}) => {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

    useEffect(() => {
        const calculateTimeRemaining = (): TimeRemaining => {
            const now = new Date().getTime();
            const target = typeof targetDate === 'string' ? new Date(targetDate).getTime() : targetDate.getTime();
            const diff = target - now;
            const isOverdue = diff < 0;
            const absDiff = Math.abs(diff);

            return {
                days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((absDiff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((absDiff / (1000 * 60)) % 60),
                seconds: Math.floor((absDiff / 1000) % 60),
                isOverdue,
                totalSeconds: Math.floor(absDiff / 1000)
            };
        };

        // Initial calculation
        setTimeRemaining(calculateTimeRemaining());

        // Update every second
        const interval = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining());
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (!timeRemaining) return null;

    // Match urgency levels with CompactBillCard status indicator
    const getUrgencyLevel = () => {
        if (timeRemaining.isOverdue) return 'critical';
        const totalHours = timeRemaining.totalSeconds / 3600;
        
        // Critical: overdue or due today
        if (totalHours < 24) return 'critical';
        
        // Warning: 3 days or less
        if (totalHours <= 72) return 'warning';
        
        // Stable: more than 3 days
        return 'stable';
    };

    const urgency = getUrgencyLevel();

    // Match exact colors from CompactBillCard status indicator
    const urgencyStyles = {
        critical: 'text-red-700 bg-red-100 border-red-200',
        warning: 'text-amber-700 bg-amber-100 border-amber-200',
        stable: 'text-emerald-700 bg-emerald-100 border-emerald-200'
    };

    const iconStyles = {
        critical: 'text-red-600',
        warning: 'text-amber-600',
        stable: 'text-emerald-600'
    };

    if (compact) {
        return (
            <div className={clsx(
                'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider',
                urgencyStyles[urgency],
                'px-2 py-0.5 rounded-md border',
                className
            )}>
                {showIcon && (
                    <span className={clsx('material-symbols-outlined text-xs', iconStyles[urgency])}>
                        {timeRemaining.isOverdue ? 'warning' : 'schedule'}
                    </span>
                )}
                <span className="tabular-nums">
                    {timeRemaining.isOverdue && '⚠️ '}
                    {timeRemaining.days} {timeRemaining.days === 1 ? 'day' : 'days'}
                </span>
            </div>
        );
    }

    return (
        <div className={clsx(
            'flex flex-col items-center gap-1 p-2 rounded-lg border',
            urgencyStyles[urgency],
            className
        )}>
            {showIcon && (
                <span className={clsx('material-symbols-outlined text-lg', iconStyles[urgency])}>
                    {timeRemaining.isOverdue ? 'priority_high' : 'schedule'}
                </span>
            )}
            <div className="flex flex-col items-center">
                <span className="text-2xl font-black tabular-nums">{timeRemaining.days}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">
                    {timeRemaining.days === 1 ? 'Day' : 'Days'}
                </span>
            </div>
            {timeRemaining.isOverdue && (
                <span className="text-[9px] font-black uppercase tracking-widest text-red-600">
                    OVERDUE
                </span>
            )}
        </div>
    );
};

export default CountdownTimer;
