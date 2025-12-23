import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    loginWithDemo: (email: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Real Firebase User
                setUser(currentUser);
                localStorage.setItem('user', JSON.stringify({
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    email: currentUser.email
                }));
            } else {
                // Check for local demo user before clearing
                const localUser = localStorage.getItem('user');
                if (localUser) {
                    try {
                        const parsed = JSON.parse(localUser);
                        if (parsed.isDemo) {
                            setUser(parsed as User); // Cast for demo purposes
                        } else {
                            setUser(null);
                            localStorage.removeItem('user');
                        }
                    } catch {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
            setLoading(false);
        });

        // Initial check for demo user if firebase takes time (prevents flicker)
        const localUser = localStorage.getItem('user');
        if (localUser && !user) {
            try {
                const parsed = JSON.parse(localUser);
                if (parsed.isDemo) {
                    setUser(parsed as User);
                    setLoading(false);
                }
            } catch { }
        }

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const loginWithDemo = async (email: string) => {
        const demoUser = {
            uid: 'demo-user',
            displayName: 'Demo User',
            email: email,
            photoURL: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            emailVerified: true,
            isDemo: true // Marker
        };
        localStorage.setItem('user', JSON.stringify(demoUser));
        setUser(demoUser as unknown as User);
        // Force navigate or let useEffect handle it
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('user');
            setUser(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, loginWithDemo, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
