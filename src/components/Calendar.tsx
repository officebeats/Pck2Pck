
import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import clsx from 'clsx';
import { Bill } from '@/hooks/useBills';
import { IncomeSource } from '@/hooks/useIncomeSources';

interface CalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    bills: Bill[];
    incomeSources: IncomeSource[];
}

export default function Calendar({ currentDate, onDateChange, bills, incomeSources }: CalendarProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Helper to check for events on a day
    const getDayEvents = (day: Date) => {
        const dayBills = bills.filter(bill => {
            if (bill.frequency === 'Monthly') {
                return bill.dueDay === day.getDate();
            }
            return false;
        });

        return {
            hasBill: dayBills.length > 0,
            hasIncome: false
        };
    };

    const nextMonth = () => onDateChange(addMonths(currentDate, 1));
    const prevMonth = () => onDateChange(subMonths(currentDate, 1));

    return (
        <div className="w-full">
            {/* Week Days Header - minimal like Koffan */}
            <div className="grid grid-cols-7 mb-1">
                {weekDays.map((day, i) => (
                    <div key={i} className="text-[9px] font-medium text-slate-400 text-center py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid - Ultra compact */}
            <div className="grid grid-cols-7">
                {days.map(day => {
                    const events = getDayEvents(day);
                    const isSelectedMonth = isSameMonth(day, monthStart);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            className="flex items-center justify-center py-1.5 relative"
                        >
                            <span
                                className={clsx(
                                    "flex items-center justify-center text-xs font-medium transition-all",
                                    !isSelectedMonth && "text-slate-300",
                                    isSelectedMonth && !isCurrentDay && "text-slate-700",
                                    isCurrentDay && "bg-primary text-white size-7 rounded-md font-bold shadow-sm",
                                    !isCurrentDay && isSelectedMonth && events.hasBill && "text-red-500 font-bold"
                                )}
                            >
                                {format(day, 'd')}
                            </span>
                            {/* Bill indicator dot */}
                            {events.hasBill && !isCurrentDay && isSelectedMonth && (
                                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-red-400"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
