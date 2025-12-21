import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useBills } from '@/hooks/useBills';
import ToastProvider from '@/components/Toast';

// Lazy Load Screens
const SignIn = lazy(() => import('./screens/SignIn'));
const Register = lazy(() => import('./screens/Register'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const RecurringExpenses = lazy(() => import('./screens/RecurringExpenses'));
const Notifications = lazy(() => import('./screens/Notifications'));
const BillDiscussion = lazy(() => import('./screens/BillDiscussion'));
const BillPayments = lazy(() => import('./screens/BillPayments'));
const IncomeSources = lazy(() => import('./screens/IncomeSources'));
const MemberProfile = lazy(() => import('./screens/MemberProfile'));
const Planning = lazy(() => import('./screens/Planning'));
const Settings = lazy(() => import('./screens/Settings'));

/**
 * Navigation configuration for the sidebar.
 */
const NavLinks = [
  { path: '/home', label: 'Home', icon: 'dashboard' },
  { path: '/bills', label: 'Bills', icon: 'payments' },
  { path: '/planning', label: 'Planner', icon: 'calendar_month' },

  { path: '/notifications', label: 'Alerts', icon: 'notifications' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

/**
 * Desktop Sidebar Navigation Component
 */
const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { bills } = useBills(); // Fetch bills for navigation visibility

  // Create safe user display values
  const displayName = user?.displayName || 'User';
  const photoURL = user?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  return (
    <div className="hidden md:flex flex-col w-64 h-full flex-shrink-0 transition-all duration-200 z-20 neo-sidebar">
      <div className="p-8 flex items-center gap-3">
        {/* Logo - Linked to Home */}
        <Link to="/home" className="flex items-center gap-4 group">
          <div className="neo-inset p-0.5 rounded-xl group-active:scale-95 transition-all">
            <div className="bg-white neo-card size-10 flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-primary font-black text-2xl">account_balance_wallet</span>
            </div>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 truncate font-sans group-hover:text-primary transition-colors">PCK2PCK</h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-3 overflow-y-auto py-4">
        {NavLinks.filter(link => {
          if (link.label === 'Bills') {
            return bills.length > 0;
          }
          return true;
        }).map((link) => {
          const isActive = location.pathname === link.path && !location.search;

          return (
            <div key={link.path}>
              <Link
                to={link.path}
                className={clsx(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                  isActive
                    ? "neo-card bg-white text-primary shadow-neo-btn-primary/10 border border-primary/5"
                    : "text-primary hover:text-primary-dark hover:bg-white/50"
                )}
              >
                <span className={clsx("material-symbols-outlined text-xl transition-all font-bold", isActive && "scale-110")}>{link.icon}</span>
                {link.label}
              </Link>
            </div >
          );
        })}
      </nav >

      <div className="p-4 mx-4 mb-6 space-y-4">
        <div className="neo-inset p-1 rounded-2xl">
          <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/50 cursor-pointer transition-all">
            <div className="neo-card p-0.5 rounded-full shrink-0 shadow-sm">
              <img className="size-9 rounded-full object-cover border-2 border-white" src={photoURL} alt="Profile" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{displayName}</p>
              <p className="text-[9px] font-black text-slate-400 truncate uppercase tracking-widest mt-0.5">Account</p>
            </div>
          </Link>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-4 px-5 py-3 w-full rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-red-500/70 hover:text-red-500 hover:bg-red-50/50 transition-all group active:scale-95"
        >
          <span className="material-symbols-outlined text-xl font-bold group-hover:rotate-12 transition-transform">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div >
  );
};

/**
 * Mobile Bottom Navigation Component
 */
const BottomNav = () => {
  const location = useLocation();
  const mobileTabs = [
    { path: '/home', label: 'Home', icon: 'dashboard' },
    { path: '/bills', label: 'Bills', icon: 'payments' },
    { path: '/planning', label: 'Planner', icon: 'calendar_month' },

    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];

  const { bills } = useBills();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-light/95 Backdrop-blur-md border-t border-white/40 z-50 safe-area-bottom pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 px-4">
        {mobileTabs.filter(tab => {
          if (tab.label === 'Bills') {
            return bills.length > 0;
          }
          return true;
        }).map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative",
                isActive ? "text-primary -translate-y-1" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_2px_10px_rgba(var(--primary-rgb),0.5)]"></div>
              )}
              <div className={clsx(
                "p-1.5 rounded-xl transition-all duration-300 shadow-none",
                isActive ? "neo-card bg-white scale-100 shadow-neo" : ""
              )}>
                <span className={clsx("material-symbols-outlined text-xl font-bold transition-colors", isActive && "fill")}>
                  {tab.icon}
                </span>
              </div>
              <span className={clsx("text-[9px] font-black uppercase tracking-widest leading-none", isActive ? "text-primary" : "text-slate-400")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ... existing ScrollToTop and ProtectedRoute components ...

/**
 * ScrollToTop helper to reset scroll position on route change.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Protected Route Wrapper
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Main App Layout and Routing Configuration
 */
function AppContent() {
  const location = useLocation();
  const isAuthScreen = location.pathname === '/' || location.pathname === '/register';

  return (
    <div className="flex h-screen w-full bg-background-light text-slate-900 overflow-hidden transition-colors duration-200 font-sans selection:bg-primary/20 selection:text-primary-dark">

      {!isAuthScreen && (
        <Sidebar />
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-20 md:pb-0">
          <div className={clsx("w-full h-full", !isAuthScreen ? "" : "flex justify-center")}>
            <div className={clsx("w-full transition-all duration-300", !isAuthScreen ? "max-w-7xl mx-auto" : "max-w-[480px]")}>
              <Suspense fallback={
                <div className="flex items-center justify-center h-full w-full">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                    <div className="h-4 w-32 rounded bg-slate-200"></div>
                  </div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<SignIn />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Routes */}
                  <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                  <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
                  <Route path="/recurring" element={<ProtectedRoute><RecurringExpenses /></ProtectedRoute>} />

                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/bill-discussion" element={<ProtectedRoute><BillDiscussion /></ProtectedRoute>} />
                  <Route path="/bills" element={<ProtectedRoute><BillPayments /></ProtectedRoute>} />
                  <Route path="/income" element={<ProtectedRoute><IncomeSources /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/member/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </div>

        {!isAuthScreen && <BottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <ScrollToTop />
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}