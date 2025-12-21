import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { getCompanyLogo, getFallbackIcon } from '@/lib/logoFetcher';

interface CompanyLogoProps {
    name: string;
    companyName?: string;
    size?: 'sm' | 'md' | 'lg';
    fallbackIcon?: string;
    className?: string;
}

const SIZE_MAP = {
    sm: { container: 'size-8', text: 'text-base', faviconSize: 32 },
    md: { container: 'size-10', text: 'text-xl', faviconSize: 64 },
    lg: { container: 'size-12', text: 'text-2xl', faviconSize: 128 },
};

/**
 * CompanyLogo Component
 * 
 * Displays a company logo fetched automatically based on the bill/income name,
 * with graceful fallback to Material Icons if no logo is found.
 */
export default function CompanyLogo({
    name,
    companyName,
    size = 'md',
    fallbackIcon,
    className
}: CompanyLogoProps) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sizeConfig = SIZE_MAP[size];

    useEffect(() => {
        // Try company name first, then fall back to bill name
        const searchTerm = companyName || name;
        const result = getCompanyLogo(searchTerm, sizeConfig.faviconSize);

        if (result.url) {
            setLogoUrl(result.url);
            setHasError(false);
        } else {
            setLogoUrl(null);
            setHasError(true);
        }
        setIsLoading(false);
    }, [name, companyName, sizeConfig.faviconSize]);

    const handleImageError = () => {
        setHasError(true);
    };

    const icon = fallbackIcon || getFallbackIcon(companyName || name);

    // Show fallback icon if loading failed or no logo found
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

    if (hasError || !logoUrl) {
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
