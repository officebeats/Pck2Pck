import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { RecurrenceRule } from '@/hooks/useBills';

interface RepeatPickerProps {
    value: RecurrenceRule;
    onChange: (rule: RecurrenceRule, summary: string) => void;
    referenceDate: Date; // The due date to generate smart presets
    onClose: () => void;
    isOpen: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Get the ordinal position of a day in the month (1st, 2nd, 3rd, 4th, 5th)
 */
const getOrdinalWeek = (date: Date): number => {
    return Math.ceil(date.getDate() / 7);
};

const getOrdinalLabel = (n: number): string => {
    const labels = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
    return labels[n] || `${n}th`;
};

/**
 * Generate a human-readable summary from a recurrence rule
 */
export const generateRecurrenceSummary = (rule: RecurrenceRule, refDate: Date): string => {
    if (rule.type === 'none') return 'Does not repeat';
    if (rule.type === 'daily') {
        return rule.interval && rule.interval > 1 ? `Every ${rule.interval} days` : 'Daily';
    }
    if (rule.type === 'weekly') {
        const dayName = DAYS_OF_WEEK[refDate.getDay()];
        return rule.interval && rule.interval > 1
            ? `Every ${rule.interval} weeks on ${dayName}`
            : `Weekly on ${dayName}`;
    }
    if (rule.type === 'monthly') {
        if (rule.bySetPos && rule.byWeekDay) {
            const dayName = DAYS_OF_WEEK[DAY_CODES.indexOf(rule.byWeekDay)];
            return `Monthly on the ${getOrdinalLabel(rule.bySetPos)} ${dayName}`;
        }
        return `Monthly on day ${rule.byMonthDay || refDate.getDate()}`;
    }
    if (rule.type === 'yearly') {
        const monthName = refDate.toLocaleDateString('en-US', { month: 'long' });
        return `Annually on ${monthName} ${refDate.getDate()}`;
    }
    if (rule.type === 'weekdays') return 'Every weekday (Mon-Fri)';
    if (rule.type === 'custom') {
        const unit = rule.unit || 'month';
        const interval = rule.interval || 1;
        return `Every ${interval > 1 ? interval + ' ' : ''}${unit}${interval > 1 ? 's' : ''}`;
    }
    return 'Custom';
};

export default function RepeatPicker({ value, onChange, referenceDate, onClose, isOpen }: RepeatPickerProps) {
    const [showCustom, setShowCustom] = useState(false);
    const [customInterval, setCustomInterval] = useState(value.interval || 1);
    const [customUnit, setCustomUnit] = useState<'day' | 'week' | 'month' | 'year'>(value.unit || 'month');
    const [repeatBy, setRepeatBy] = useState<'dayOfMonth' | 'dayOfWeek'>('dayOfMonth');
    const [endType, setEndType] = useState<'never' | 'count' | 'until'>(value.endType || 'never');
    const [endCount, setEndCount] = useState(value.endCount || 10);
    const [endDate, setEndDate] = useState(value.endDate || '');

    const dayOfWeek = referenceDate.getDay();
    const dayOfMonth = referenceDate.getDate();
    const ordinalWeek = getOrdinalWeek(referenceDate);
    const dayName = DAYS_OF_WEEK[dayOfWeek];
    const dayCode = DAY_CODES[dayOfWeek];
    const monthName = referenceDate.toLocaleDateString('en-US', { month: 'long' });

    // Generate smart presets based on reference date
    const presets = useMemo(() => [
        {
            label: 'Does not repeat',
            rule: { type: 'none' as const }
        },
        {
            label: 'Daily',
            rule: { type: 'daily' as const }
        },
        {
            label: `Weekly on ${dayName}`,
            rule: { type: 'weekly' as const, byDay: [dayCode] }
        },
        {
            label: `Monthly on day ${dayOfMonth}`,
            rule: { type: 'monthly' as const, byMonthDay: dayOfMonth }
        },
        {
            label: `Monthly on the ${getOrdinalLabel(ordinalWeek)} ${dayName}`,
            rule: { type: 'monthly' as const, bySetPos: ordinalWeek, byWeekDay: dayCode }
        },
        {
            label: `Annually on ${monthName} ${dayOfMonth}`,
            rule: { type: 'yearly' as const, byMonthDay: dayOfMonth }
        }
    ], [dayName, dayCode, dayOfMonth, ordinalWeek, monthName]);

    const handlePresetSelect = (preset: typeof presets[0]) => {
        onChange(preset.rule, preset.label);
        onClose();
    };

    const handleCustomSave = () => {
        let rule: RecurrenceRule = {
            type: 'custom',
            interval: customInterval,
            unit: customUnit,
            endType,
        };

        if (customUnit === 'month' && repeatBy === 'dayOfWeek') {
            rule.bySetPos = ordinalWeek;
            rule.byWeekDay = dayCode;
        } else if (customUnit === 'month') {
            rule.byMonthDay = dayOfMonth;
        }

        if (endType === 'count') rule.endCount = endCount;
        if (endType === 'until') rule.endDate = endDate;

        const summary = generateRecurrenceSummary(rule, referenceDate);
        onChange(rule, summary);
        setShowCustom(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="neo-card w-full max-w-sm p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-sm font-black text-black uppercase tracking-widest">
                        {showCustom ? 'Custom Repeat' : 'Repeat'}
                    </h3>
                    <button onClick={onClose} className="neo-btn p-2 rounded-full">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {!showCustom ? (
                    /* Preset Options */
                    <div className="p-2 max-h-[60vh] overflow-y-auto">
                        {presets.map((preset, i) => (
                            <button
                                key={i}
                                onClick={() => handlePresetSelect(preset)}
                                className={clsx(
                                    "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                                    value.type === preset.rule.type
                                        ? "bg-primary/10 text-primary"
                                        : "text-black hover:bg-slate-100"
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}

                        <div className="border-t border-slate-200 my-2" />

                        <button
                            onClick={() => setShowCustom(true)}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-black hover:bg-slate-100 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">tune</span>
                            Custom...
                        </button>
                    </div>
                ) : (
                    /* Custom Options */
                    <div className="p-4 space-y-4">
                        {/* Repeat Every */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Repeat every
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={customInterval}
                                    onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
                                    className="neo-inset w-16 p-2 text-center font-bold text-black rounded-xl"
                                />
                                <select
                                    value={customUnit}
                                    onChange={(e) => setCustomUnit(e.target.value as any)}
                                    className="neo-inset flex-1 p-2 font-semibold text-black rounded-xl"
                                >
                                    <option value="day">day{customInterval > 1 ? 's' : ''}</option>
                                    <option value="week">week{customInterval > 1 ? 's' : ''}</option>
                                    <option value="month">month{customInterval > 1 ? 's' : ''}</option>
                                    <option value="year">year{customInterval > 1 ? 's' : ''}</option>
                                </select>
                            </div>
                        </div>

                        {/* Repeat By (for monthly) */}
                        {customUnit === 'month' && (
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Repeat by
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setRepeatBy('dayOfMonth')}
                                        className={clsx(
                                            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                                            repeatBy === 'dayOfMonth'
                                                ? "neo-btn-primary"
                                                : "neo-btn"
                                        )}
                                    >
                                        Day of month
                                    </button>
                                    <button
                                        onClick={() => setRepeatBy('dayOfWeek')}
                                        className={clsx(
                                            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                                            repeatBy === 'dayOfWeek'
                                                ? "neo-btn-primary"
                                                : "neo-btn"
                                        )}
                                    >
                                        Day of week
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Ends */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Ends
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="endType"
                                        checked={endType === 'never'}
                                        onChange={() => setEndType('never')}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm font-semibold text-black">Never</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="endType"
                                        checked={endType === 'count'}
                                        onChange={() => setEndType('count')}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm font-semibold text-black">After</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={endCount}
                                        onChange={(e) => setEndCount(parseInt(e.target.value) || 1)}
                                        disabled={endType !== 'count'}
                                        className="neo-inset w-16 p-1 text-center font-bold text-black rounded-lg disabled:opacity-50"
                                    />
                                    <span className="text-sm text-slate-500">occurrences</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="endType"
                                        checked={endType === 'until'}
                                        onChange={() => setEndType('until')}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm font-semibold text-black">On</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        disabled={endType !== 'until'}
                                        className="neo-inset flex-1 p-1 font-semibold text-black rounded-lg disabled:opacity-50"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Summary Preview */}
                        <div className="neo-inset p-3 rounded-xl">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Summary</p>
                            <p className="text-sm font-bold text-primary">
                                {generateRecurrenceSummary({
                                    type: 'custom',
                                    interval: customInterval,
                                    unit: customUnit,
                                    bySetPos: repeatBy === 'dayOfWeek' ? ordinalWeek : undefined,
                                    byWeekDay: repeatBy === 'dayOfWeek' ? dayCode : undefined,
                                    byMonthDay: repeatBy === 'dayOfMonth' ? dayOfMonth : undefined,
                                }, referenceDate)}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowCustom(false)}
                                className="neo-btn flex-1 py-3 rounded-xl font-bold text-sm"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCustomSave}
                                className="neo-btn-primary flex-1 py-3 rounded-xl font-bold text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
