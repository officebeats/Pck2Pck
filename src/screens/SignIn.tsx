import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import clsx from 'clsx';

export default function SignIn() {
  const { signInWithGoogle, loginWithDemo, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Tabs: 'method' | 'phone_otp'
  const [authMethod, setAuthMethod] = useState<'quick' | 'phone'>('quick');

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'number' | 'otp'>('number');

  // Demo State
  const [demoEmail] = useState('demo@pck2pck.app');

  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithDemo(demoEmail);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
      alert("Failed to login with Google");
      setLoading(false);
    }
  };

  // Phone Auth Functions
  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setLoading(true);
    setupRecaptcha();

    const appVerifier = (window as any).recaptchaVerifier;
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      // SMS sent
      (window as any).confirmationResult = confirmationResult;
      setVerificationId(confirmationResult.verificationId);
      setPhoneStep('otp');
      setLoading(false);
    } catch (error) {
      console.error("Error during SMS sending", error);
      setLoading(false);
      alert("Failed to send SMS. Make sure phone number includes country code (e.g. +1)");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const confirmationResult = (window as any).confirmationResult;
      await confirmationResult.confirm(otp);
      // User signed in successfully. useEffect will redirect.
    } catch (error) {
      console.error("Error verifying OTP", error);
      setLoading(false);
      alert("Invalid Code");
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

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 neo-inset rounded-xl w-full">
          <button
            onClick={() => setAuthMethod('quick')}
            className={clsx(
              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              authMethod === 'quick' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Quick Access
          </button>
          <button
            onClick={() => setAuthMethod('phone')}
            className={clsx(
              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              authMethod === 'phone' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Phone
          </button>
        </div>

        <div className="w-full neo-card p-6 space-y-5 bg-white/50 backdrop-blur-md border border-white/60 min-h-[300px] flex flex-col justify-center">

          {authMethod === 'quick' && (
            <div className="space-y-5 animate-fade-in">
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
                <div className="space-y-3 opacity-50 pointer-events-none select-none filter grayscale">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg transition-colors">mail</span>
                    <input
                      type="email"
                      placeholder="COORDINATES"
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
          )}

          {authMethod === 'phone' && (
            <div className="space-y-5 animate-fade-in">
              <div id="recaptcha-container"></div>
              {phoneStep === 'number' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                    <div className="relative group mt-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">smartphone</span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 555 555 5555"
                        className="neo-inset w-full p-3.5 pl-11 rounded-xl text-slate-900 text-sm font-bold placeholder:text-slate-300 focus:outline-none"
                        required
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2 px-1 leading-tight">Include country code (e.g. +1 for US)</p>
                  </div>
                  <button type="submit" disabled={loading} className="neo-btn-primary w-full py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all">
                    {loading ? "SENDING..." : "SEND CODE"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verifying</p>
                    <p className="text-sm font-bold text-slate-700">{phoneNumber}</p>
                  </div>
                  <div className="relative group mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">lock</span>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="neo-inset w-full p-3.5 pl-11 rounded-xl text-slate-900 text-lg font-bold tracking-[0.5em] text-center placeholder:text-slate-300 focus:outline-none"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhoneStep('number')}
                      className="neo-btn flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl"
                    >
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="neo-btn-primary flex-[2] py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all">
                      {loading ? "VERIFYING..." : "VERIFY"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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