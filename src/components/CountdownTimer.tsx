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

    // Determine urgency level for styling
    const getUrgencyLevel = () => {
        if (timeRemaining.isOverdue) return 'overdue';
        if (timeRemaining.totalSeconds < 86400) return 'critical'; // < 1 day
        if (timeRemaining.totalSeconds < 259200) return 'warning'; // < 3 days
        return 'normal';
    };

    const urgency = getUrgencyLevel();

    const urgencyStyles = {
        overdue: 'text-red-600 bg-red-50',
        critical: 'text-orange-600 bg-orange-50',
        warning: 'text-amber-600 bg-amber-50',
        normal: 'text-slate-600 bg-slate-50'
    };

    const iconStyles = {
        overdue: 'text-red-500',
        critical: 'text-orange-500',
        warning: 'text-amber-500',
        normal: 'text-slate-400'
    };

    if (compact) {
        return (
            <div className={clsx(
                'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider',
                urgencyStyles[urgency],
                'px-2 py-0.5 rounded-md',
                className
            )}>
                {showIcon && (
                    <span className={clsx('material-symbols-outlined text-xs', iconStyles[urgency])}>
                        {timeRemaining.isOverdue ? 'warning' : 'schedule'}
                    </span>
                )}
                <span className="tabular-nums">
                    {timeRemaining.isOverdue && '⚠️ '}
                    {timeRemaining.days}d {timeRemaining.hours.toString().padStart(2, '0')}h {timeRemaining.minutes.toString().padStart(2, '0')}m {timeRemaining.seconds.toString().padStart(2, '0')}s
                </span>
            </div>
        );
    }

    return (
        <div className={clsx(
            'flex flex-col items-center gap-1 p-2 rounded-lg',
            urgencyStyles[urgency],
            className
        )}>
            {showIcon && (
                <span className={clsx('material-symbols-outlined text-lg', iconStyles[urgency])}>
                    {timeRemaining.isOverdue ? 'priority_high' : 'schedule'}
                </span>
            )}
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black tabular-nums">{timeRemaining.days}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Days</span>
                </div>
                <span className="text-xl font-black opacity-50">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black tabular-nums">{timeRemaining.hours.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Hrs</span>
                </div>
                <span className="text-xl font-black opacity-50">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black tabular-nums">{timeRemaining.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Min</span>
                </div>
                <span className="text-xl font-black opacity-50">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black tabular-nums">{timeRemaining.seconds.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Sec</span>
                </div>
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
