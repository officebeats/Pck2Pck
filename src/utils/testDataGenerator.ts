/**
 * Test Data Generator for PCK2PCK
 * 
 * This utility generates realistic test data for comprehensive QA testing.
 * It creates bills, income sources, and payment histories with various scenarios.
 */

import { Bill, RecurrenceRule } from '../hooks/useBills';
import { IncomeSource } from '../hooks/useIncomeSources';

// --- Test Data Templates ---

const BILL_CATEGORIES = [
    'Housing', 'Utilities', 'Transportation', 'Food', 'Healthcare',
    'Insurance', 'Entertainment', 'Subscriptions', 'Debt', 'Savings'
];

const BILL_TEMPLATES = [
    { name: 'Rent', category: 'Housing', amount: 1500, icon: 'home', companyName: 'Property Management' },
    { name: 'Electric Bill', category: 'Utilities', amount: 120, icon: 'bolt', companyName: 'Power Company' },
    { name: 'Water Bill', category: 'Utilities', amount: 45, icon: 'water_drop', companyName: 'Water Utility' },
    { name: 'Internet', category: 'Utilities', amount: 80, icon: 'wifi', companyName: 'ISP Provider' },
    { name: 'Car Payment', category: 'Transportation', amount: 350, icon: 'directions_car', companyName: 'Auto Finance' },
    { name: 'Car Insurance', category: 'Insurance', amount: 150, icon: 'shield', companyName: 'Insurance Co' },
    { name: 'Health Insurance', category: 'Healthcare', amount: 300, icon: 'health_and_safety', companyName: 'Health Plan' },
    { name: 'Netflix', category: 'Entertainment', amount: 15.99, icon: 'movie', companyName: 'Netflix' },
    { name: 'Spotify', category: 'Entertainment', amount: 10.99, icon: 'music_note', companyName: 'Spotify' },
    { name: 'Gym Membership', category: 'Healthcare', amount: 50, icon: 'fitness_center', companyName: 'Fitness Club' },
    { name: 'Phone Bill', category: 'Utilities', amount: 75, icon: 'phone_iphone', companyName: 'Mobile Carrier' },
    { name: 'Credit Card', category: 'Debt', amount: 200, icon: 'credit_card', companyName: 'Bank' },
];

const INCOME_TEMPLATES = [
    { name: 'Primary Job', amount: 3500, icon: 'work' },
    { name: 'Side Hustle', amount: 800, icon: 'attach_money' },
    { name: 'Freelance Work', amount: 1200, icon: 'laptop' },
    { name: 'Investment Income', amount: 300, icon: 'trending_up' },
];

// --- Generator Functions ---

/**
 * Generate a random date within the next N days
 */
function getRandomFutureDate(daysAhead: number = 30): Date {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * daysAhead);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + randomDays);
    return futureDate;
}

/**
 * Generate a random past date within the last N days
 */
function getRandomPastDate(daysAgo: number = 30): Date {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * daysAgo);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - randomDays);
    return pastDate;
}

/**
 * Generate a monthly recurrence rule
 */
function generateMonthlyRecurrence(dayOfMonth: number): RecurrenceRule {
    return {
        type: 'monthly',
        byMonthDay: dayOfMonth
    };
}

/**
 * Generate a biweekly recurrence rule
 */
function generateBiweeklyRecurrence(): RecurrenceRule {
    return {
        type: 'custom',
        interval: 2,
        unit: 'week'
    };
}

/**
 * Generate test bills with various scenarios
 */
export function generateTestBills(count: number = 10): Omit<Bill, 'id'>[] {
    const bills: Omit<Bill, 'id'>[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (let i = 0; i < count; i++) {
        const template = BILL_TEMPLATES[i % BILL_TEMPLATES.length];
        
        // Create bills with varied due dates to test cycle logic
        // First half: current cycle (0-14 days)
        // Second half: next cycle (15-30 days)
        const isCurrentCycle = i < count / 2;
        const minDays = isCurrentCycle ? 0 : 15;
        const maxDays = isCurrentCycle ? 14 : 30;
        const daysAhead = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
        
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + daysAhead);
        const dayOfMonth = dueDate.getDate();

        const recurrence = generateMonthlyRecurrence(dayOfMonth);
        
        // Determine status based on due date
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let status: Bill['status'];
        if (daysUntilDue < 0) {
            status = 'overdue';
        } else if (daysUntilDue === 0) {
            status = 'due_today';
        } else if (daysUntilDue <= 3) {
            status = 'due_soon';
        } else {
            status = 'upcoming';
        }
        
        // Determine cycle based on days ahead
        const cycle: 'current' | 'next' = daysAhead <= 14 ? 'current' : 'next';

        bills.push({
            name: template.name,
            companyName: template.companyName,
            amount: template.amount,
            dueDate: dueDate.toISOString(),
            dueDateIso: dueDate.toISOString(),
            status,
            icon: template.icon,
            category: template.category,
            paycheckLabel: 'Unassigned',
            cycle,
            recurrence,
            recurrenceSummary: `Monthly on day ${dayOfMonth}`,
            frequency: 'Monthly',
            dueDay: dayOfMonth,
            color: 'blue',
            owner: Math.random() > 0.5 ? 'Joint' : (Math.random() > 0.5 ? 'Ernesto' : 'Steph'),
            isTentative: Math.random() > 0.8, // 20% chance of being tentative
            comments: [],
            history: []
        });
    }

    return bills;
}

/**
 * Generate test income sources
 */
export function generateTestIncome(count: number = 2): Omit<IncomeSource, 'id'>[] {
    const sources: Omit<IncomeSource, 'id'>[] = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
        const template = INCOME_TEMPLATES[i % INCOME_TEMPLATES.length];
        
        // Primary income is biweekly, others are monthly
        const recurrence = i === 0 ? generateBiweeklyRecurrence() : generateMonthlyRecurrence(1);
        const frequencyDisplay = i === 0 ? 'Every 2 weeks' : 'Monthly';
        
        // Calculate next payday
        const nextPayday = new Date(today);
        if (i === 0) {
            // Biweekly - next Friday
            const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
            nextPayday.setDate(today.getDate() + daysUntilFriday);
        } else {
            // Monthly - 1st of next month
            nextPayday.setMonth(today.getMonth() + 1);
            nextPayday.setDate(1);
        }

        sources.push({
            name: template.name,
            amount: template.amount,
            nextPayday: nextPayday.toISOString().split('T')[0],
            frequencyDisplay,
            recurrence,
            icon: template.icon
        });
    }

    return sources;
}

/**
 * Generate paid bills for history testing
 */
export function generatePaidBills(count: number = 5): Omit<Bill, 'id'>[] {
    const bills: Omit<Bill, 'id'>[] = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
        const template = BILL_TEMPLATES[i % BILL_TEMPLATES.length];
        const paidDate = getRandomPastDate(30);
        const dueDate = new Date(paidDate);
        dueDate.setDate(paidDate.getDate() - Math.floor(Math.random() * 5)); // Paid 0-5 days after due

        bills.push({
            name: template.name,
            companyName: template.companyName,
            amount: template.amount,
            dueDate: dueDate.toISOString(),
            dueDateIso: dueDate.toISOString(),
            status: 'paid',
            icon: template.icon,
            category: template.category,
            paycheckLabel: 'Paycheck 1',
            cycle: 'previous',
            recurrence: generateMonthlyRecurrence(dueDate.getDate()),
            recurrenceSummary: `Monthly on day ${dueDate.getDate()}`,
            frequency: 'Monthly',
            dueDay: dueDate.getDate(),
            color: 'blue',
            owner: 'Joint',
            isTentative: false,
            comments: [],
            history: [{
                date: paidDate.toISOString(),
                amount: template.amount,
                paidBy: 'Demo User'
            }],
            lastPaid: paidDate.toISOString()
        });
    }

    return bills;
}

/**
 * Generate a complete test dataset
 */
export function generateCompleteTestData() {
    return {
        upcomingBills: generateTestBills(10),
        paidBills: generatePaidBills(5),
        incomeSources: generateTestIncome(2)
    };
}

/**
 * Load test data into localStorage (for demo mode)
 */
export function loadTestDataToLocalStorage() {
    const testData = generateCompleteTestData();
    
    // Combine upcoming and paid bills
    const allBills = [...testData.upcomingBills, ...testData.paidBills].map((bill, index) => ({
        ...bill,
        id: `test_bill_${index}`
    }));

    const allIncome = testData.incomeSources.map((source, index) => ({
        ...source,
        id: `test_income_${index}`
    }));

    localStorage.setItem('pchk_bills', JSON.stringify(allBills));
    localStorage.setItem('pchk_income_sources', JSON.stringify(allIncome)); // Fixed: use correct key

    console.log('✅ Test data loaded successfully!');
    console.log(`📊 Generated ${allBills.length} bills and ${allIncome.length} income sources`);
    
    return { bills: allBills, income: allIncome };
}

/**
 * Clear all test data from localStorage
 */
export function clearTestData() {
    localStorage.removeItem('pchk_bills');
    localStorage.removeItem('pchk_income_sources'); // Fixed: use correct key
    console.log('🗑️ Test data cleared');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    (window as any).testDataGenerator = {
        generate: generateCompleteTestData,
        load: loadTestDataToLocalStorage,
        clear: clearTestData,
        generateBills: generateTestBills,
        generateIncome: generateTestIncome,
        generatePaidBills
    };
}
