import React from 'react';
import clsx from 'clsx';

export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export interface FrequencyOption {
    id: PayFrequency;
    label: string;
    description: string;
    icon: string;
}

// Most common pay frequencies for US workers (based on BLS data)
export const INCOME_FREQUENCIES: FrequencyOption[] = [
    {
        id: 'biweekly',
        label: 'Every 2 Weeks',
        description: '26 paychecks/year',
        icon: 'event_repeat'
    },
    {
        id: 'weekly',
        label: 'Every Week',
        description: '52 paychecks/year',
        icon: 'calendar_view_week'
    },
    {
        id: 'semimonthly',
        label: 'Twice a Month',
        description: '1st & 15th',
        icon: 'calendar_today'
    },
    {
        id: 'monthly',
        label: 'Once a Month',
        description: '12 paychecks/year',
        icon: 'calendar_month'
    }
];

// Bill frequencies are simpler - mostly monthly
export const BILL_FREQUENCIES: FrequencyOption[] = [
    {
        id: 'monthly',
        label: 'Monthly',
        description: 'Same day each month',
        icon: 'calendar_month'
    },
    {
        id: 'biweekly',
        label: 'Every 2 Weeks',
        description: 'Repeats every 14 days',
        icon: 'event_repeat'
    },
    {
        id: 'weekly',
        label: 'Weekly',
        description: 'Same day each week',
        icon: 'calendar_view_week'
    }
];

interface SimpleFrequencyPickerProps {
    value: PayFrequency;
    onChange: (frequency: PayFrequency) => void;
    type: 'income' | 'bill';
    className?: string;
}

export default function SimpleFrequencyPicker({
    value,
    onChange,
    type,
    className
}: SimpleFrequencyPickerProps) {
    const options = type === 'income' ? INCOME_FREQUENCIES : BILL_FREQUENCIES;

    return (
        <div className={clsx("space-y-2", className)}>
            {options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => onChange(option.id)}
                    className={clsx(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                        value === option.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                >
                    <div className={clsx(
                        "size-10 rounded-full flex items-center justify-center transition-colors",
                        value === option.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                    )}>
                        <span className="material-symbols-outlined text-xl">{option.icon}</span>
                    </div>
                    <div className="flex-1 text-left">
                        <p className={clsx(
                            "font-bold text-sm",
                            value === option.id ? "text-primary" : "text-slate-900"
                        )}>
                            {option.label}
                        </p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                    {value === option.id && (
                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                    )}
                </button>
            ))}
        </div>
    );
}

/**
 * Convert PayFrequency to RecurrenceRule for storage
 */
export const frequencyToRecurrence = (freq: PayFrequency, dueDay: number = 1) => {
    switch (freq) {
        case 'weekly':
            return { type: 'weekly' as const };
        case 'biweekly':
            return { type: 'custom' as const, interval: 2, unit: 'week' as const };
        case 'semimonthly':
            return { type: 'semimonthly' as const, byMonthDays: [1, 15] };
        case 'monthly':
        default:
            return { type: 'monthly' as const, byMonthDay: dueDay };
    }
};

/**
 * Get a friendly display label for a frequency
 */
export const getFrequencyLabel = (freq: PayFrequency): string => {
    const option = [...INCOME_FREQUENCIES, ...BILL_FREQUENCIES].find(o => o.id === freq);
    return option?.label || freq;
};
