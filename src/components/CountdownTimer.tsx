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

    // Enhanced urgency levels with UX best practices
    // Progressive color coding provides clear visual hierarchy
    const getUrgencyLevel = () => {
        if (timeRemaining.isOverdue) return 'overdue';
        const totalHours = timeRemaining.totalSeconds / 3600;
        
        if (totalHours < 12) return 'critical';    // < 12 hours - Immediate action needed
        if (totalHours < 24) return 'urgent';      // < 1 day - Action needed soon
        if (totalHours < 72) return 'warning';     // < 3 days - Plan ahead
        if (totalHours < 168) return 'attention';  // < 7 days - Be aware
        return 'normal';                            // 7+ days - No urgency
    };

    const urgency = getUrgencyLevel();

    // Progressive color system following UX best practices
    // Red → Orange → Amber → Yellow → Green
    const urgencyStyles = {
        overdue: 'text-red-700 bg-red-100 border-red-200',
        critical: 'text-orange-700 bg-orange-100 border-orange-200',
        urgent: 'text-amber-700 bg-amber-100 border-amber-200',
        warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
        attention: 'text-blue-700 bg-blue-50 border-blue-200',
        normal: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    };

    const iconStyles = {
        overdue: 'text-red-600',
        critical: 'text-orange-600',
        urgent: 'text-amber-600',
        warning: 'text-yellow-600',
        attention: 'text-blue-600',
        normal: 'text-emerald-600'
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
