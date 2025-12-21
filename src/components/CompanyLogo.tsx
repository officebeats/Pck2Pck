import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { getCompanyLogo, getFallbackIcon } from '@/lib/logoFetcher';
import { getBillEmoji, isEmoji } from '@/lib/emojiPicker';

interface CompanyLogoProps {
    name: string;
    companyName?: string;
    customLogoUrl?: string; // If provided, bypasses auto-detection (can be URL or emoji)
    category?: string; // For better emoji fallback
    size?: 'sm' | 'md' | 'lg';
    fallbackIcon?: string;
    className?: string;
    type?: 'bill' | 'income'; // Helps with emoji selection
}

const SIZE_MAP = {
    sm: { container: 'size-8', text: 'text-base', emoji: 'text-lg', faviconSize: 32 },
    md: { container: 'size-10', text: 'text-xl', emoji: 'text-2xl', faviconSize: 64 },
    lg: { container: 'size-12', text: 'text-2xl', emoji: 'text-3xl', faviconSize: 128 },
};

/**
 * CompanyLogo Component
 * 
 * Displays a company logo, emoji, or Material Icon based on the bill/income name.
 * Priority:
 * 1. Custom emoji if customLogoUrl is an emoji
 * 2. Custom logo URL if customLogoUrl is a URL
 * 3. Auto-detected logo from company name
 * 4. Smart emoji based on name
 * 5. Fallback Material Icon
 */
export default function CompanyLogo({
    name,
    companyName,
    customLogoUrl,
    category,
    size = 'md',
    fallbackIcon,
    className,
    type = 'bill'
}: CompanyLogoProps) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [displayEmoji, setDisplayEmoji] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sizeConfig = SIZE_MAP[size];

    useEffect(() => {
        // Check if custom value is an emoji
        if (customLogoUrl && isEmoji(customLogoUrl)) {
            setDisplayEmoji(customLogoUrl);
            setLogoUrl(null);
            setHasError(false);
            setIsLoading(false);
            return;
        }

        // If custom logo URL is provided, use it directly
        if (customLogoUrl) {
            setLogoUrl(customLogoUrl);
            setDisplayEmoji(null);
            setHasError(false);
            setIsLoading(false);
            return;
        }

        // Otherwise, try auto-detection
        const searchTerm = companyName || name;
        const result = getCompanyLogo(searchTerm, sizeConfig.faviconSize);

        if (result.url) {
            setLogoUrl(result.url);
            setDisplayEmoji(null);
            setHasError(false);
        } else {
            // No logo found - use smart emoji as default
            const emoji = getBillEmoji(name, category);
            setDisplayEmoji(emoji);
            setLogoUrl(null);
            setHasError(false);
        }
        setIsLoading(false);
    }, [name, companyName, customLogoUrl, category, sizeConfig.faviconSize]);

    const handleImageError = () => {
        // On image error, fall back to emoji
        const emoji = getBillEmoji(name, category);
        setDisplayEmoji(emoji);
        setHasError(true);
    };

    const icon = fallbackIcon || getFallbackIcon(companyName || name);

    // Show loading state
    if (isLoading) {
        return (
            <div className={clsx(
                "rounded-full flex items-center justify-center bg-slate-100 animate-pulse",
                sizeConfig.container,
                className
            )}>
                <span className={clsx("material-symbols-outlined text-slate-300", sizeConfig.text)}>
                    image
                </span>
            </div>
        );
    }

    // Display emoji if set
    if (displayEmoji) {
        return (
            <div className={clsx(
                "rounded-full flex items-center justify-center bg-slate-100",
                sizeConfig.container,
                className
            )}>
                <span className={sizeConfig.emoji}>{displayEmoji}</span>
            </div>
        );
    }

    // Display logo if available
    if (logoUrl && !hasError) {
        return (
            <div className={clsx(
                "rounded-full flex items-center justify-center bg-white border border-slate-100 overflow-hidden",
                sizeConfig.container,
                className
            )}>
                <img
                    src={logoUrl}
                    alt={`${companyName || name} logo`}
                    className="w-full h-full object-contain p-1"
                    onError={handleImageError}
                />
            </div>
        );
    }

    // Fallback to Material Icon
    return (
        <div className={clsx(
            "rounded-full flex items-center justify-center bg-primary/10 text-primary",
            sizeConfig.container,
            className
        )}>
            <span className={clsx("material-symbols-outlined", sizeConfig.text)}>
                {icon}
            </span>
        </div>
    );
}
