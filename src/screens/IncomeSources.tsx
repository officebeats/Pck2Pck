import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

import { useIncomeSources, IncomeSource } from '@/hooks/useIncomeSources';
import RepeatPicker, { generateRecurrenceSummary } from '@/components/RepeatPicker';
import { RecurrenceRule } from '@/hooks/useBills';

export default function IncomeSources() {
  const navigate = useNavigate();
  const { sources, addSource, updateSource, deleteSource } = useIncomeSources();

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [nextPayday, setNextPayday] = useState('');

  // Frequency Logic State (Integrated with RepeatPicker)
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({ type: 'custom', interval: 2, unit: 'week' });
  const [recurrenceSummary, setRecurrenceSummary] = useState('Every 2 weeks');
  const [isRepeatPickerOpen, setIsRepeatPickerOpen] = useState(false);

  // Payday Modal States
  const [showPaydayModal, setShowPaydayModal] = useState(false);
  const [paydayConfirmationText, setPaydayConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handlers
  const handleAddClick = () => {
    setEditingId(null);
    setModalMode('edit');
    setName('');
    setAmount('');

    // Nearest Upcoming Friday Calculation
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);

    // Format to YYYY-MM-DD local
    const formattedDate = `${nextFriday.getFullYear()}-${String(nextFriday.getMonth() + 1).padStart(2, '0')}-${String(nextFriday.getDate()).padStart(2, '0')}`;
    setNextPayday(formattedDate);

    // Default to Bi-weekly
    setRecurrence({ type: 'custom', interval: 2, unit: 'week' });
    setRecurrenceSummary('Every 2 weeks');

    setIsModalOpen(true);
  };

  const handleEditClick = (source: IncomeSource) => {
    setEditingId(source.id);
    setModalMode('view'); // Default to view
    setName(source.name);
    setAmount(source.amount.toString());
    setNextPayday(source.nextPayday);

    const rule = source.recurrence || { type: 'monthly' };
    setRecurrence(rule);
    setRecurrenceSummary(source.frequencyDisplay || generateRecurrenceSummary(rule, new Date(source.nextPayday)));

    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !amount || !nextPayday) return;

    const numAmount = parseFloat(amount);
    const frequencyDisplay = recurrenceSummary;
    const finalRecurrence = recurrence;

    if (editingId) {
      await updateSource(editingId, {
        name,
        amount: numAmount,
        frequencyDisplay,
        recurrence: finalRecurrence,
        nextPayday
      });
    } else {
      await addSource({
        name,
        amount: numAmount,
        frequencyDisplay,
        recurrence: finalRecurrence,
        nextPayday,
        icon: 'attach_money'
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingId) {
      await deleteSource(editingId);
      setIsModalOpen(false);
    }
  };

  const handleConfirmPayday = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setShowPaydayModal(false);
    setPaydayConfirmationText('');
  };

  const getPaydayStatus = (dateStr: string) => {
    if (!dateStr) return { text: '', color: '' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (diffDays < 0) return { text: `Paid on ${formattedDate}`, color: 'text-gray-500' };
    if (diffDays === 0) return { text: 'Today', color: 'text-green-600 font-bold' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-primary font-bold' };
    if (diffDays <= 30) return { text: `In ${diffDays} days`, color: 'text-primary font-semibold' };
    return { text: formattedDate, color: 'text-gray-500' };
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light font-sans transition-colors duration-200">
      <div className="sticky top-0 z-20 flex flex-col bg-background-light/95 backdrop-blur-md border-b border-white/40 transition-colors">
        <div className="flex items-center p-4 pb-2 justify-between gap-3">
          <div onClick={() => navigate(-1)} className="neo-btn flex size-9 shrink-0 items-center justify-center text-slate-800 cursor-pointer rounded-full active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </div>
          <h1 className="text-slate-900 text-lg font-black leading-tight tracking-tight flex-1 text-center md:text-left">My Income</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPaydayModal(true)}
              className="neo-btn-primary px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 whitespace-nowrap shadow-md"
            >
              <span className="material-symbols-outlined text-lg">payments</span>
              <span className="hidden sm:inline">Payday</span>
            </button>
            <button
              onClick={handleAddClick}
              className="neo-btn size-9 flex items-center justify-center rounded-full text-primary shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-xl font-bold">add</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        {/* List of Sources */}
        <div className="space-y-3">
          {sources.length === 0 && (
            <div className="neo-card p-8 flex flex-col items-center justify-center text-center">
              <div className="neo-inset size-20 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-emerald-300">account_balance</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No Income Sources</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-[260px]">Add your paychecks, side hustles, or other income streams to track your paydays and plan bills.</p>
              <button
                onClick={handleAddClick}
                className="neo-btn-primary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Income Source
                </span>
              </button>
            </div>
          )}

          {sources.map((source) => {
            const status = getPaydayStatus(source.nextPayday);
            return (
              <div
                key={source.id}
                onClick={() => handleEditClick(source)}
                className="neo-card flex items-center gap-3 p-3 cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all"
              >
                <div className="neo-inset flex size-10 shrink-0 items-center justify-center rounded-2xl text-emerald-600 bg-emerald-50">
                  <span className="material-symbols-outlined text-xl">{source.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm text-slate-900 tracking-tight">{source.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Next:</span>
                    <span className={clsx("text-[10px] font-black uppercase tracking-widest", status.color)}>{status.text}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-slate-900 tabular-nums">${source.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{source.frequencyDisplay}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* View/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm p-0 pb-20 sm:p-4 animate-fade-in">
          <div className="neo-card w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl transform transition-transform animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {modalMode === 'view' ? 'Income Details' : (editingId ? 'Edit Income' : 'Add Income')}
              </h2>
              <div className="flex items-center gap-2">
                {modalMode === 'view' && (
                  <button onClick={() => setModalMode('edit')} className="neo-btn rounded-full p-2 text-primary hover:text-primary/80">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                )}
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 hover:bg-gray-100 text-gray-500">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl neo-inset">
                  <div className="neo-card flex items-center justify-center size-16 rounded-full text-emerald-500 mb-4 bg-white">
                    <span className="material-symbols-outlined text-3xl font-bold">payments</span>
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{name}</h3>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">${parseFloat(amount || '0').toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="neo-card p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Frequency</span>
                    <span className="font-black text-xs text-slate-800 mt-1 text-center uppercase tracking-tight">{recurrenceSummary}</span>
                  </div>
                  <div className="neo-card p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Next Payday</span>
                    <span className="font-black text-xs text-slate-800 mt-1 uppercase tracking-tight">
                      {new Date(nextPayday).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode Form
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Source Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salary, Freelance" className="neo-inset w-full rounded-xl p-3.5 text-slate-900 focus:outline-none text-sm font-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Amount ($)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="neo-inset w-full rounded-xl p-3.5 text-slate-900 focus:outline-none text-sm font-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Frequency</label>
                  <button
                    type="button"
                    onClick={() => setIsRepeatPickerOpen(true)}
                    className="neo-inset w-full p-3.5 rounded-xl text-left flex items-center justify-between"
                  >
                    <span className="text-sm font-black text-slate-900 truncate">{recurrenceSummary}</span>
                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Next Payday</label>
                  <input type="date" value={nextPayday} onChange={(e) => setNextPayday(e.target.value)} className="neo-inset w-full rounded-xl p-3.5 text-slate-900 focus:outline-none text-sm font-black" />
                </div>
                <div className="mt-8 flex gap-3">
                  {editingId && (
                    <button onClick={handleDelete} className="px-5 py-3 rounded-xl border-2 border-red-50 text-red-600 font-black hover:bg-red-50 transition-all text-xs active:scale-95">Delete</button>
                  )}
                  <div className="flex-1"></div>
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl border-2 border-slate-50 text-slate-500 font-black hover:bg-slate-50 transition-all text-xs active:scale-95">Cancel</button>
                  <button onClick={handleSave} className="neo-btn-primary px-6 py-3 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all">Confirm Income</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payday Modal */}
      {showPaydayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="neo-card w-full max-w-md overflow-hidden transform transition-all scale-100 p-0 border-2 border-white/50">
            <div className="bg-emerald-500 p-8 text-white text-center relative overflow-hidden">
              <span className="material-symbols-outlined text-9xl absolute -bottom-8 -right-8 opacity-20 rotate-12">payments</span>
              <h2 className="text-3xl font-bold relative z-10 text-shadow-sm">It's Payday!</h2>
              <p className="text-emerald-50 font-medium relative z-10 mt-1">Confirm your deposit and update your budget.</p>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={handleConfirmPayday}
                disabled={isProcessing}
                className="neo-btn-primary w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg"
              >
                {isProcessing ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    <span>Confirm Deposit</span>
                  </>
                )}
              </button>
              <div className="text-center">
                <button
                  onClick={() => setShowPaydayModal(false)}
                  disabled={isProcessing}
                  className="text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Repeat Picker Modal */}
      <RepeatPicker
        isOpen={isRepeatPickerOpen}
        onClose={() => setIsRepeatPickerOpen(false)}
        value={recurrence}
        referenceDate={new Date(nextPayday)}
        onChange={(rule, summary) => {
          setRecurrence(rule);
          setRecurrenceSummary(summary);
        }}
      />
    </div>
  );
}