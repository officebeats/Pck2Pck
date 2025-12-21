import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setIsLoading(true);
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    // Simulate API call and Initialize Empty State for New User
    setTimeout(() => {
      const user = {
        name: 'New User',
        email: email,
        avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
      };
      localStorage.setItem('user', JSON.stringify(user));

      // --- Initialize Empty Data for Persistence ---
      // This ensures the new user starts with a blank slate instead of mock data
      localStorage.setItem('pchk_dashboard_bills', JSON.stringify([]));
      localStorage.setItem('pchk_planning_bills', JSON.stringify([]));
      localStorage.setItem('pchk_recurring_bills', JSON.stringify([]));
      localStorage.setItem('pchk_income_sources', JSON.stringify([]));
      localStorage.setItem('pchk_chats', JSON.stringify([]));
      localStorage.setItem('pchk_notifications', JSON.stringify([]));
      localStorage.setItem('pchk_bill_payments', JSON.stringify([]));

      navigate('/home');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-background-light text-slate-900 transition-colors duration-200">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/')} className="neo-btn rounded-full size-10 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 className="text-4xl font-black leading-tight pb-2 text-slate-900 tracking-tighter">Join the Family.</h1>
        <p className="text-slate-400 text-sm pb-10 font-black uppercase tracking-widest">Manage your budget together.</p>

        <div className="flex flex-col gap-5">
          {error && <div className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100 animate-shake">{error}</div>}

          <div className="space-y-1">
            <span className="ml-1 font-black text-[10px] text-slate-400 uppercase tracking-widest">Email</span>
            <div className="relative">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neo-inset w-full p-4 rounded-xl text-slate-900 text-sm font-black placeholder:text-slate-200 focus:outline-none transition-all"
                placeholder="email@example.com"
                type="email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="ml-1 font-black text-[10px] text-slate-400 uppercase tracking-widest">Password</span>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neo-inset w-full p-4 rounded-xl text-slate-900 text-sm font-black placeholder:text-slate-200 focus:outline-none transition-all"
                placeholder="Create password"
                type="password"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="ml-1 font-black text-[10px] text-slate-400 uppercase tracking-widest">Confirm Password</span>
            <div className="relative">
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="neo-inset w-full p-4 rounded-xl text-slate-900 text-sm font-black placeholder:text-slate-200 focus:outline-none transition-all"
                placeholder="Confirm password"
                type="password"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className={`mt-10 neo-btn-primary w-full h-15 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg ${isLoading ? 'opacity-80 grayscale' : ''}`}>
          {isLoading ? <span className="material-symbols-outlined animate-spin font-black">progress_activity</span> : 'Create Account'}
        </button>
      </div>
    </div>
  );
}