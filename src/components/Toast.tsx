import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';

// --- Types ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    duration?: number; // ms, default 5000
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (toast: Omit<Toast, 'id'>) => void;
    showError: (title: string, message?: string, action?: Toast['action']) => void;
    showSuccess: (title: string, message?: string) => void;
    dismissToast: (id: string) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// --- Provider ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { ...toast, id, duration: toast.duration ?? 5000 };
        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after duration
        if (newToast.duration > 0) {
            setTimeout(() => dismissToast(id), newToast.duration);
        }
    }, [dismissToast]);

    const showError = useCallback((title: string, message?: string, action?: Toast['action']) => {
        showToast({ type: 'error', title, message, action, duration: 8000 });
    }, [showToast]);

    const showSuccess = useCallback((title: string, message?: string) => {
        showToast({ type: 'success', title, message, duration: 3000 });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, showError, showSuccess, dismissToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}

// --- Toast Container ---
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[], onDismiss: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
            ))}
        </div>
    );
}

// --- Toast Item Props ---
interface ToastItemProps {
    toast: Toast;
    onDismiss: () => void;
}

// --- Toast Item ---
const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    const config = {
        success: {
            icon: 'check_circle',
            bg: 'bg-emerald-600',
            iconBg: 'bg-emerald-500',
        },
        error: {
            icon: 'error',
            bg: 'bg-red-600',
            iconBg: 'bg-red-500',
        },
        warning: {
            icon: 'warning',
            bg: 'bg-amber-600',
            iconBg: 'bg-amber-500',
        },
        info: {
            icon: 'info',
            bg: 'bg-blue-600',
            iconBg: 'bg-blue-500',
        },
    }[toast.type];

    return (
        <div
            className={clsx(
                "pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transition-all duration-200",
                config.bg,
                isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 animate-slide-up"
            )}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={clsx("size-8 rounded-full flex items-center justify-center flex-shrink-0", config.iconBg)}>
                    <span className="material-symbols-outlined text-white text-lg">{config.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{toast.title}</p>
                    {toast.message && (
                        <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{toast.message}</p>
                    )}
                    {toast.action && (
                        <button
                            onClick={() => {
                                toast.action?.onClick();
                                handleDismiss();
                            }}
                            className="mt-2 text-xs font-bold text-white underline underline-offset-2 hover:no-underline"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                {/* Dismiss */}
                <button onClick={handleDismiss} className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-white/70 text-lg">close</span>
                </button>
            </div>
        </div>
    );
}

// --- Error Messages Helper ---
export const getErrorMessage = (error: unknown): { title: string, message: string, action?: string } => {
    // Handle Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as any).code;

        switch (code) {
            case 'permission-denied':
                return {
                    title: 'Permission Denied',
                    message: 'You don\'t have permission to perform this action. Please sign in with your account.',
                    action: 'Sign In'
                };
            case 'unauthenticated':
                return {
                    title: 'Not Signed In',
                    message: 'You need to sign in to save your data. Demo mode has limited functionality.',
                    action: 'Sign In'
                };
            case 'unavailable':
                return {
                    title: 'Service Unavailable',
                    message: 'Unable to connect to the server. Please check your internet connection and try again.',
                    action: 'Retry'
                };
            case 'network-request-failed':
                return {
                    title: 'No Internet Connection',
                    message: 'Please check your internet connection and try again.',
                    action: 'Retry'
                };
            case 'deadline-exceeded':
                return {
                    title: 'Request Timeout',
                    message: 'The request took too long. Please try again.',
                    action: 'Retry'
                };
            case 'not-found':
                return {
                    title: 'Not Found',
                    message: 'The requested item could not be found. It may have been deleted.',
                };
            case 'already-exists':
                return {
                    title: 'Already Exists',
                    message: 'An item with this name already exists. Please use a different name.',
                };
            default:
                break;
        }
    }

    // Handle generic errors
    if (error instanceof Error) {
        // Check for common error patterns
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return {
                title: 'Connection Error',
                message: 'Unable to connect to the server. Please check your internet connection.',
                action: 'Retry'
            };
        }
        if (error.message.includes('timeout')) {
            return {
                title: 'Request Timeout',
                message: 'The request took too long. Please try again.',
                action: 'Retry'
            };
        }

        return {
            title: 'Something Went Wrong',
            message: error.message || 'An unexpected error occurred. Please try again.',
        };
    }

    // Fallback
    return {
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again or contact support if the issue persists.',
    };
};

export default ToastProvider;
