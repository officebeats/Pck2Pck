import { RecurrenceRule } from '../hooks/useBills';

/**
 * Basic recurrence calculation logic for Pck2Pck.
 * Not a full iCal implementation, but covers the app's needs.
 */

export const getNextOccurrences = (
    rule: RecurrenceRule,
    startDate: Date,
    count: number = 10,
    endPeriod?: Date
): Date[] => {
    const occurrences: Date[] = [];
    let current = new Date(startDate);

    // Initial occurrence is always the start date
    occurrences.push(new Date(current));

    if (rule.type === 'none') return occurrences;

    while (occurrences.length < count) {
        let next = new Date(current);

        if (rule.type === 'daily') {
            next.setDate(current.getDate() + (rule.interval || 1));
        } else if (rule.type === 'weekly') {
            next.setDate(current.getDate() + 7 * (rule.interval || 1));
        } else if (rule.type === 'monthly') {
            if (rule.bySetPos && rule.byWeekDay) {
                // Logic for "Second Wednesday" etc.
                // Move to next month first
                next.setMonth(current.getMonth() + (rule.interval || 1));
                next.setDate(1);
                // Find occurrences in that month... 
                // (Simplified for now: just move month and find the day)
                // TODO: Full implementation for bySetPos
                next = getNextMonthOccurrence(next, rule);
            } else {
                next.setMonth(current.getMonth() + (rule.interval || 1));
                // Handle month overflow (e.g., Jan 31 -> Feb 28)
                const expectedDay = rule.byMonthDay || startDate.getDate();
                if (next.getDate() !== expectedDay) {
                    next.setDate(0);
                }
            }
        } else if (rule.type === 'yearly') {
            next.setFullYear(current.getFullYear() + (rule.interval || 1));
        } else if (rule.type === 'custom') {
            const interval = rule.interval || 1;
            const unit = rule.unit || 'month';
            if (unit === 'day') next.setDate(current.getDate() + interval);
            if (unit === 'week') next.setDate(current.getDate() + 7 * interval);
            if (unit === 'month') next.setMonth(current.getMonth() + interval);
            if (unit === 'year') next.setFullYear(current.getFullYear() + interval);
        } else if (rule.type === 'weekdays') {
            // Simplified: every day except Sat/Sun
            next.setDate(current.getDate() + 1);
            while (next.getDay() === 0 || next.getDay() === 6) {
                next.setDate(next.getDate() + 1);
            }
        } else {
            break; // Unknown type
        }

        if (endPeriod && next > endPeriod) break;
        if (rule.endType === 'until' && rule.endDate && next > new Date(rule.endDate)) break;
        if (rule.endType === 'count' && rule.endCount && occurrences.length >= rule.endCount) break;

        occurrences.push(new Date(next));
        current = next;
    }

    return occurrences;
};

// Helper for complex monthly logic
const getNextMonthOccurrence = (monthDate: Date, rule: RecurrenceRule): Date => {
    // This is a placeholder for specific "2nd Wednesday" logic
    // For now, we return the 15th as a fallback or just the monthDate
    return monthDate;
};
