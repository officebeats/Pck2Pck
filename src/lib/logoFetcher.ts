/**
 * Logo Fetcher Utility
 * 
 * Provides functions to automatically fetch company logos based on:
 * 1. Known company name -> domain mappings
 * 2. Google Favicon API (free, no API key needed)
 * 3. Fallback to branded icon placeholders
 */

// --- Known Company Mappings ---
// Common bills and their associated domains for logo fetching
const COMPANY_DOMAINS: Record<string, string> = {
    // Utilities
    'electric': 'energy.gov',
    'electricity': 'energy.gov',
    'power': 'energy.gov',
    'gas': 'energy.gov',
    'water': 'water.org',
    'sewer': 'water.org',
    'trash': 'waste-management.com',
    'garbage': 'waste-management.com',

    // Internet & Phone
    'internet': 'speedtest.net',
    'wifi': 'speedtest.net',
    'comcast': 'xfinity.com',
    'xfinity': 'xfinity.com',
    'spectrum': 'spectrum.com',
    'att': 'att.com',
    'at&t': 'att.com',
    'verizon': 'verizon.com',
    't-mobile': 't-mobile.com',
    'tmobile': 't-mobile.com',
    'cricket': 'cricketwireless.com',
    'metro': 'metrobyt-mobile.com',
    'google fi': 'fi.google.com',

    // Streaming
    'netflix': 'netflix.com',
    'hulu': 'hulu.com',
    'disney': 'disneyplus.com',
    'disney+': 'disneyplus.com',
    'hbo': 'hbomax.com',
    'max': 'max.com',
    'amazon prime': 'amazon.com',
    'prime video': 'primevideo.com',
    'apple tv': 'tv.apple.com',
    'peacock': 'peacocktv.com',
    'paramount': 'paramountplus.com',
    'youtube': 'youtube.com',
    'youtube tv': 'tv.youtube.com',
    'spotify': 'spotify.com',
    'apple music': 'music.apple.com',
    'pandora': 'pandora.com',
    'tidal': 'tidal.com',
    'audible': 'audible.com',

    // Insurance
    'geico': 'geico.com',
    'state farm': 'statefarm.com',
    'progressive': 'progressive.com',
    'allstate': 'allstate.com',
    'liberty mutual': 'libertymutual.com',
    'usaa': 'usaa.com',
    'nationwide': 'nationwide.com',
    'farmers': 'farmers.com',
    'car insurance': 'cars.com',
    'auto insurance': 'cars.com',
    'health insurance': 'healthcare.gov',
    'life insurance': 'lifehappens.org',

    // Banking & Finance
    'mortgage': 'bankrate.com',
    'rent': 'zillow.com',
    'chase': 'chase.com',
    'bank of america': 'bankofamerica.com',
    'wells fargo': 'wellsfargo.com',
    'capital one': 'capitalone.com',
    'citi': 'citi.com',
    'citibank': 'citi.com',
    'discover': 'discover.com',
    'amex': 'americanexpress.com',
    'american express': 'americanexpress.com',
    'paypal': 'paypal.com',
    'venmo': 'venmo.com',
    'cash app': 'cash.app',
    'sofi': 'sofi.com',
    'affirm': 'affirm.com',
    'klarna': 'klarna.com',

    // Subscriptions
    'gym': 'planetfitness.com',
    'planet fitness': 'planetfitness.com',
    'la fitness': 'lafitness.com',
    '24 hour fitness': '24hourfitness.com',
    'peloton': 'onepeloton.com',
    'xbox': 'xbox.com',
    'playstation': 'playstation.com',
    'nintendo': 'nintendo.com',
    'adobe': 'adobe.com',
    'microsoft': 'microsoft.com',
    'office 365': 'microsoft.com',
    'google': 'google.com',
    'icloud': 'icloud.com',
    'dropbox': 'dropbox.com',
    'slack': 'slack.com',
    'zoom': 'zoom.us',

    // Retail
    'amazon': 'amazon.com',
    'costco': 'costco.com',
    'walmart': 'walmart.com',
    'target': 'target.com',
    'sams club': 'samsclub.com',

    // Food
    'doordash': 'doordash.com',
    'uber eats': 'ubereats.com',
    'grubhub': 'grubhub.com',
    'instacart': 'instacart.com',
    'blue apron': 'blueapron.com',
    'hello fresh': 'hellofresh.com',

    // Income Sources
    'salary': 'linkedin.com',
    'paycheck': 'adp.com',
    'payroll': 'adp.com',
    'freelance': 'upwork.com',
    'uber': 'uber.com',
    'lyft': 'lyft.com',
    'doordash driver': 'doordash.com',
    'etsy': 'etsy.com',
    'ebay': 'ebay.com',
    'shopify': 'shopify.com',
};

// --- Logo URL Generators ---

/**
 * Get a logo URL using Google's Favicon service (free, no API key)
 * Sizes: 16, 32, 64, 128, 256
 */
export function getGoogleFavicon(domain: string, size: number = 128): string {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * Get a logo URL using Logo.dev (free tier available)
 * Note: May require API key for production use
 */
export function getLogoDev(domain: string): string {
    return `https://img.logo.dev/${domain}?token=pk_FREE`;
}

/**
 * Get a logo URL using DuckDuckGo icons (free, no API key)
 */
export function getDuckDuckGoIcon(domain: string): string {
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// --- Main Logo Fetcher ---

export interface LogoResult {
    url: string | null;
    source: 'google' | 'logodev' | 'duckduckgo' | 'fallback';
    domain: string | null;
}

/**
 * Try to find a company logo based on name or company name
 * Uses multiple strategies:
 * 1. Check known company mappings
 * 2. Try to extract domain from company name
 * 3. Use Google Favicon API
 */
export function getCompanyLogo(nameOrCompany: string, size: number = 64): LogoResult {
    if (!nameOrCompany) {
        return { url: null, source: 'fallback', domain: null };
    }

    const searchName = nameOrCompany.toLowerCase().trim();

    // Strategy 1: Check known mappings
    for (const [key, domain] of Object.entries(COMPANY_DOMAINS)) {
        if (searchName.includes(key) || key.includes(searchName)) {
            return {
                url: getGoogleFavicon(domain, size),
                source: 'google',
                domain
            };
        }
    }

    // Strategy 2: Check if it looks like a domain already
    if (searchName.includes('.com') || searchName.includes('.org') || searchName.includes('.net')) {
        const domain = searchName.replace(/https?:\/\//, '').replace(/\/.*$/, '');
        return {
            url: getGoogleFavicon(domain, size),
            source: 'google',
            domain
        };
    }

    // Strategy 3: Try to construct a domain from the name
    const cleanName = searchName
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .trim();

    if (cleanName.length >= 3) {
        const guessedDomain = `${cleanName}.com`;
        return {
            url: getGoogleFavicon(guessedDomain, size),
            source: 'google',
            domain: guessedDomain
        };
    }

    return { url: null, source: 'fallback', domain: null };
}

/**
 * Check if a logo URL is valid/loadable
 */
export async function validateLogoUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        return response.ok && contentType?.startsWith('image/');
    } catch {
        return false;
    }
}

/**
 * Get the best available logo with fallback verification
 */
export async function getBestLogo(nameOrCompany: string, size: number = 64): Promise<LogoResult> {
    const result = getCompanyLogo(nameOrCompany, size);

    if (result.url) {
        // Verify the logo is valid
        const isValid = await validateLogoUrl(result.url);
        if (isValid) {
            return result;
        }
    }

    return { url: null, source: 'fallback', domain: null };
}

// --- Material Icons Fallback ---
// Map bill categories to Material Symbols icons
export const CATEGORY_ICONS: Record<string, string> = {
    'utilities': 'electric_bolt',
    'electric': 'electric_bolt',
    'power': 'electric_bolt',
    'gas': 'local_fire_department',
    'water': 'water_drop',
    'internet': 'wifi',
    'phone': 'phone_android',
    'streaming': 'play_circle',
    'entertainment': 'movie',
    'insurance': 'shield',
    'car': 'directions_car',
    'health': 'health_and_safety',
    'rent': 'home',
    'mortgage': 'home',
    'subscription': 'subscriptions',
    'gym': 'fitness_center',
    'food': 'restaurant',
    'shopping': 'shopping_bag',
    'income': 'attach_money',
    'salary': 'payments',
    'freelance': 'work',
    'default': 'receipt_long'
};

export function getFallbackIcon(nameOrCategory: string): string {
    const search = nameOrCategory.toLowerCase();

    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (search.includes(key)) {
            return icon;
        }
    }

    return CATEGORY_ICONS.default;
}
