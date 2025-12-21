/**
 * Smart Emoji Picker for Bills and Income
 * 
 * Maps common bill/income names to relevant emojis.
 * Falls back to category-based or generic emojis.
 */

// Common bill name to emoji mappings
const BILL_EMOJI_MAP: Record<string, string> = {
    // Utilities
    'electric': '💡',
    'electricity': '💡',
    'power': '⚡',
    'gas': '🔥',
    'water': '💧',
    'sewer': '🚿',
    'trash': '🗑️',
    'garbage': '🗑️',
    'internet': '📶',
    'wifi': '📶',
    'cable': '📺',
    'tv': '📺',
    'phone': '📱',
    'mobile': '📱',
    'cell': '📱',

    // Housing
    'rent': '🏠',
    'mortgage': '🏠',
    'hoa': '🏘️',
    'property tax': '🏛️',
    'home insurance': '🏠',
    'renters insurance': '🏠',

    // Transportation
    'car': '🚗',
    'auto': '🚗',
    'vehicle': '🚗',
    'car insurance': '🚗',
    'auto insurance': '🚗',
    'gas station': '⛽',
    'fuel': '⛽',
    'parking': '🅿️',
    'car payment': '🚗',
    'auto loan': '🚗',

    // Finance
    'credit card': '💳',
    'visa': '💳',
    'mastercard': '💳',
    'amex': '💳',
    'discover': '💳',
    'loan': '🏦',
    'student loan': '🎓',
    'bank': '🏦',

    // Health
    'health': '🏥',
    'medical': '🏥',
    'doctor': '👨‍⚕️',
    'dental': '🦷',
    'dentist': '🦷',
    'vision': '👓',
    'pharmacy': '💊',
    'prescription': '💊',
    'gym': '💪',
    'fitness': '💪',

    // Entertainment & Subscriptions
    'netflix': '🎬',
    'hulu': '📺',
    'disney': '🏰',
    'spotify': '🎵',
    'apple music': '🎵',
    'amazon': '📦',
    'prime': '📦',
    'youtube': '▶️',
    'gaming': '🎮',
    'xbox': '🎮',
    'playstation': '🎮',
    'steam': '🎮',

    // Food
    'groceries': '🛒',
    'food': '🍽️',
    'restaurant': '🍽️',
    'doordash': '🍔',
    'ubereats': '🍔',
    'grubhub': '🍔',

    // Insurance
    'insurance': '🛡️',
    'life insurance': '❤️',
    'pet insurance': '🐾',

    // Misc
    'tuition': '🎓',
    'school': '🎓',
    'childcare': '👶',
    'daycare': '👶',
    'pet': '🐾',
    'vet': '🐾',
    'storage': '📦',
    'subscription': '🔄',
    'membership': '🎫',
};

// Income source mappings
const INCOME_EMOJI_MAP: Record<string, string> = {
    'salary': '💼',
    'paycheck': '💰',
    'wage': '💰',
    'work': '💼',
    'job': '💼',
    'employer': '🏢',
    'freelance': '💻',
    'contract': '📝',
    'consulting': '💼',
    'side hustle': '🌙',
    'gig': '🎯',
    'uber': '🚗',
    'lyft': '🚗',
    'delivery': '📦',
    'tips': '💵',
    'bonus': '🎁',
    'commission': '📈',
    'dividend': '📊',
    'investment': '📈',
    'interest': '🏦',
    'rental': '🏠',
    'rent income': '🏠',
    'social security': '🏛️',
    'pension': '🏛️',
    'retirement': '🏖️',
    'disability': '♿',
    'child support': '👶',
    'alimony': '💍',
    'gift': '🎁',
    'refund': '💵',
    'tax refund': '📋',
};

// Category fallbacks
const CATEGORY_EMOJI_MAP: Record<string, string> = {
    'utilities': '🔌',
    'housing': '🏠',
    'transportation': '🚗',
    'food': '🍽️',
    'health': '🏥',
    'entertainment': '🎬',
    'shopping': '🛍️',
    'personal': '👤',
    'education': '🎓',
    'travel': '✈️',
    'business': '💼',
    'general': '📄',
};

/**
 * Get the best matching emoji for a bill name
 */
export function getBillEmoji(name: string, category?: string): string {
    const lowerName = name.toLowerCase();

    // Check direct matches first
    for (const [key, emoji] of Object.entries(BILL_EMOJI_MAP)) {
        if (lowerName.includes(key)) {
            return emoji;
        }
    }

    // Check category fallback
    if (category) {
        const lowerCategory = category.toLowerCase();
        if (CATEGORY_EMOJI_MAP[lowerCategory]) {
            return CATEGORY_EMOJI_MAP[lowerCategory];
        }
    }

    // Default bill emoji
    return '📄';
}

/**
 * Get the best matching emoji for an income source
 */
export function getIncomeEmoji(name: string): string {
    const lowerName = name.toLowerCase();

    // Check direct matches
    for (const [key, emoji] of Object.entries(INCOME_EMOJI_MAP)) {
        if (lowerName.includes(key)) {
            return emoji;
        }
    }

    // Default income emoji
    return '💰';
}

/**
 * Common emoji picker options for quick selection
 */
export const COMMON_BILL_EMOJIS = [
    '💡', '💧', '🔥', '📶', '📺', '📱', // Utilities
    '🏠', '🚗', '⛽', '💳', '🏦', '🎓', // Big expenses
    '🏥', '🦷', '💊', '💪', '🛡️', // Health
    '🎬', '🎵', '🎮', '📦', '🛒', // Entertainment/Shopping
    '🐾', '👶', '✈️', '📄', '💼', '🔄', // Misc
];

export const COMMON_INCOME_EMOJIS = [
    '💰', '💵', '💳', '💼', '🏢', '💻', // Work
    '📈', '📊', '🏦', '🏠', // Investments
    '🎁', '🏛️', '🏖️', '🎯', // Other income
];

/**
 * Check if a string is an emoji
 */
export function isEmoji(str: string): boolean {
    // Simple check - emojis are typically 1-4 characters and contain emoji unicode
    const emojiRegex = /\p{Extended_Pictographic}/u;
    return emojiRegex.test(str) && str.length <= 4;
}
