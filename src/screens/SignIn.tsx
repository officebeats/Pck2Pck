import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const { signInWithGoogle, loginWithDemo, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [demoEmail, setDemoEmail] = useState('demo@pchk.com');

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithDemo(demoEmail);
      // useEffect will trigger redirect
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Auth state change will trigger the useEffect redirect
    } catch (error) {
      console.error("Login failed", error);
      alert("Failed to login with Google");
      setLoading(false);
    }
  };



  return (
    <div className="h-full flex flex-col justify-center items-center px-6 relative overflow-hidden bg-background-light transition-colors duration-200">

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center gap-6 mb-8">
        <div className="flex flex-col items-center gap-3 animate-slide-down">
          <div className="w-16 h-16 neo-card flex items-center justify-center transform hover:scale-105 transition-transform duration-500 rounded-2xl bg-white shadow-lg">
            <span className="material-symbols-outlined text-3xl text-primary font-bold">savings</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 drop-shadow-sm">PCK2PCK</h1>
            <p className="text-slate-400 text-[9px] font-black tracking-[0.3em] uppercase mt-1.5 opacity-80">Cycle Survival Kit</p>
          </div>
        </div>

        <div className="w-full neo-card p-6 space-y-5 bg-white/50 backdrop-blur-md border border-white/60">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full neo-btn flex items-center justify-center gap-3 py-3.5 transition-all rounded-xl shadow-sm active:scale-95 bg-white"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4 grayscale opacity-70" />
                <span className="font-black text-xs text-slate-600 uppercase tracking-widest">Continue with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-4 w-full opacity-60">
            <div className="h-[1px] flex-1 bg-slate-300"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">or initialize demo</span>
            <div className="h-[1px] flex-1 bg-slate-300"></div>
          </div>

          <form onSubmit={handleDemoLogin} className="flex flex-col gap-4">
            <div className="space-y-3">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg transition-colors">mail</span>
                <input
                  type="email"
                  placeholder="COORDINATES"
                  className="neo-inset w-full p-3.5 pl-11 rounded-xl text-slate-900 text-xs font-black uppercase tracking-widest focus:outline-none placeholder:text-slate-300"
                  disabled
                />
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg transition-colors">lock</span>
                <input
                  type="password"
                  placeholder="PROTOCOL"
                  className="neo-inset w-full p-3.5 pl-11 rounded-xl text-slate-900 text-xs font-black uppercase tracking-widest focus:outline-none placeholder:text-slate-300"
                  disabled
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="neo-btn-primary w-full py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all">
              {loading ? "INITIALIZING..." : "INITIATE DEMO SEQUENCE"}
            </button>
          </form>
        </div>

        <div className="neo-card py-4 px-6 animate-fade-in rounded-2xl bg-white/40 border border-white/50 backdrop-blur-sm">
          <p className="text-[9px] text-center text-slate-400 font-black leading-relaxed uppercase tracking-widest opacity-70">
            By proceeding, you agree to retain full custody of your financial sovereignty.
          </p>
        </div>
      </div>
    </div>
  );
}