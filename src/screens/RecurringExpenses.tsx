import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import CommentModal, { Comment } from '../components/CommentModal';

import { useRecurringExpenses, RecurringExpense } from '@/hooks/useRecurringExpenses';

export default function RecurringExpenses() {
  const navigate = useNavigate();

  // State for Bills with Persistence
  // State for Bills with Persistence
  const { expenses: bills, addExpense, updateExpense, deleteExpense } = useRecurringExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Payday Modal States
  const [showPaydayModal, setShowPaydayModal] = useState(false);
  const [paydayConfirmationText, setPaydayConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [discussingBillId, setDiscussingBillId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'Monthly',
    nextDueText: '',
    category: '',
    icon: 'receipt',
    color: 'blue' as RecurringExpense['color'],
    reminderEnabled: false,
    reminderDaysBefore: 1,
    reminderTime: '09:00',
    dueDay: 1,
    dueDayOfWeek: 'Monday'
  });

  const handleOpenModal = (bill?: RecurringExpense) => {
    if (bill) {
      setEditingId(bill.id);
      setFormData({
        name: bill.name,
        amount: bill.amount.toString(),
        frequency: bill.frequency,
        nextDueText: bill.nextDueText,
        category: bill.category,
        icon: bill.icon,
        color: bill.color,
        reminderEnabled: bill.reminder.enabled,
        reminderDaysBefore: bill.reminder.daysBefore,
        reminderTime: bill.reminder.time,
        dueDay: bill.dueDay || 1,
        dueDayOfWeek: bill.dueDayOfWeek || 'Monday'
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        amount: '',
        frequency: 'Monthly',
        nextDueText: '',
        category: '',
        icon: 'receipt',
        color: 'blue',
        reminderEnabled: false,
        reminderDaysBefore: 1,
        reminderTime: '09:00',
        dueDay: 1,
        dueDayOfWeek: 'Monday'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.amount) return;
    const numAmount = parseFloat(formData.amount);

    // Auto-generate nextDueText if empty, based on simple logic
    let nextDueText = formData.nextDueText;
    if (!nextDueText) {
      const today = new Date();
      if (formData.frequency === 'Monthly') {
        // Basic next date calc for display
        let targetMonth = today.getMonth();
        if (today.getDate() > formData.dueDay) targetMonth++;
        const date = new Date(today.getFullYear(), targetMonth, formData.dueDay);
        nextDueText = `Next: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (formData.frequency === 'Weekly') {
        nextDueText = `Every ${formData.dueDayOfWeek}`;
      } else {
        nextDueText = 'Next: TBD';
      }
    }

    const isWarning = nextDueText.toLowerCase().includes('due in') || nextDueText.toLowerCase().includes('overdue');
    const cycle: 'current' | 'next' = Math.random() > 0.5 ? 'current' : 'next';
    const paycheckLabel = cycle === 'current' ? 'Oct #2' : 'Nov #1';

    const reminderSettings = {
      enabled: formData.reminderEnabled,
      daysBefore: formData.reminderDaysBefore,
      time: formData.reminderTime
    };

    const updatedData = {
      name: formData.name,
      amount: numAmount,
      frequency: formData.frequency,
      nextDueText,
      category: formData.category,
      icon: formData.icon,
      color: formData.color,
      isWarning,
      reminder: reminderSettings,
      dueDay: formData.dueDay,
      dueDayOfWeek: formData.dueDayOfWeek
    };

    if (editingId) {
      updateExpense(editingId, updatedData);
    } else {
      addExpense({
        cycle,
        paycheckLabel,
        comments: [],
        ...updatedData
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingId) {
      await deleteExpense(editingId);
      setIsModalOpen(false);
    }
  };

  const handleConfirmPayday = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Logic to add balance would go here
    setIsProcessing(false);
    setShowPaydayModal(false);
    setPaydayConfirmationText('');
  };

  const handleAddComment = (text: string) => {
    if (!discussingBillId) return;
    const bill = bills.find(b => b.id === discussingBillId);
    if (!bill) return;

    const newComment: Comment = {
      id: Date.now(),
      user: 'You',
      text,
      timestamp: 'Just now',
      isMe: true
    };

    updateExpense(discussingBillId, { comments: [...(bill.comments || []), newComment] });
  };

  const getColorClasses = (color: string, isBg: boolean) => {
    const base = {
      blue: isBg ? 'bg-blue-100' : 'text-blue-600',
      green: isBg ? 'bg-green-100' : 'text-green-600',
      purple: isBg ? 'bg-purple-100' : 'text-purple-600',
      orange: isBg ? 'bg-orange-100' : 'text-orange-600',
      red: isBg ? 'bg-red-100' : 'text-red-100',
    };
    return base[color as keyof typeof base] || (isBg ? 'bg-gray-100' : 'text-gray-500');
  };

  const discussingBill = bills.find(b => b.id === discussingBillId);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light font-sans transition-colors duration-200">
      <div className="flex items-center bg-background-light/95 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-20 border-b border-white/40 transition-colors md:p-6 md:pb-0 gap-3">
        <button onClick={() => navigate(-1)} className="neo-btn flex size-9 shrink-0 items-center justify-center text-slate-800 rounded-full shadow-sm active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <h2 className="text-slate-900 text-lg font-black leading-tight tracking-tight flex-1 text-center">Recurring Bills</h2>
        <div className="flex items-center">
          <button
            onClick={() => setShowPaydayModal(true)}
            className="neo-btn-primary px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 whitespace-nowrap shadow-md"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            <span className="hidden sm:inline">Payday</span>
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-3 pb-24 md:px-6">
        {bills.map((bill) => (
          <div
            key={bill.id}
            onClick={() => handleOpenModal(bill)}
            className="neo-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={clsx("neo-inset flex items-center justify-center size-12 rounded-2xl bg-white", getColorClasses(bill.color, false))}>
                <span className="material-symbols-outlined text-2xl">{bill.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-sm text-slate-900 leading-tight tracking-tight">{bill.name}</p>
                  {bill.reminder.enabled && (
                    <span className="material-symbols-outlined text-[14px] text-primary font-black" title={`Reminder: ${bill.reminder.daysBefore} days before at ${bill.reminder.time}`}>notifications_active</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                  {bill.frequency} • {bill.frequency === 'Monthly' ? `Day ${bill.dueDay}` : bill.frequency === 'Weekly' ? `${bill.dueDayOfWeek}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-right">
                <p className="font-black text-base text-slate-900 tabular-nums leading-tight">${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                <p className={clsx("text-[9px] font-black uppercase tracking-widest mt-1 px-1.5 py-0.5 rounded-full", bill.isWarning ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500")}>
                  {bill.nextDueText}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDiscussingBillId(bill.id); }}
                className="text-slate-300 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                {bill.comments && bill.comments.length > 0 && <span className="text-[10px] font-black">{bill.comments.length}</span>}
              </button>
            </div>
          </div>
        ))}

        {bills.length === 0 && (
          <div className="neo-card flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
            <div className="neo-inset size-20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No Recurring Bills</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-[240px]">Set up your recurring expenses to track when they're due and never miss a bill payment.</p>
            <button
              onClick={() => handleOpenModal()}
              className="neo-btn-primary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">add</span>
                Add First Bill
              </span>
            </button>
          </div>
        )}
      </main>

      {
        bills.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => handleOpenModal()}
              className="neo-btn-primary flex size-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl">add</span>
            </button>
          </div>
        )
      }

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm p-0 pb-20 sm:p-4 animate-fade-in">
          <div className="neo-card w-full max-w-sm max-h-[90vh] overflow-y-auto transform transition-transform animate-slide-up sm:animate-none p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Bill' : 'New Bill'}
              </h2>
              <div className="flex items-center gap-2">
                {editingId && (
                  <button onClick={() => setDiscussingBillId(editingId)} className="neo-btn rounded-full p-2 text-gray-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">chat_bubble_outline</span>
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="neo-btn rounded-full p-2 text-gray-500"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Bill Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Netflix" className="neo-inset w-full p-3.5 text-slate-900 text-sm font-black focus:outline-none rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Amount</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" className="neo-inset w-full p-3.5 text-slate-900 text-sm font-black focus:outline-none rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Frequency</label>
                  <div className="neo-inset px-3 rounded-xl">
                    <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} className="neo-input w-full py-3.5 text-slate-900 text-sm font-black bg-transparent border-none focus:outline-none [&>option]:bg-white [&>option]:text-slate-900">
                      <option>Monthly</option>
                      <option>Weekly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                </div>
                <div>
                  {formData.frequency === 'Monthly' && (
                    <>
                      <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Day of Month</label>
                      <input type="number" min="1" max="31" value={formData.dueDay} onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) })} className="neo-inset w-full p-3.5 text-slate-900 text-sm font-black focus:outline-none rounded-xl" placeholder="1-31" />
                    </>
                  )}
                  {formData.frequency === 'Weekly' && (
                    <>
                      <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Day of Week</label>
                      <div className="neo-inset px-3 rounded-xl">
                        <select value={formData.dueDayOfWeek} onChange={(e) => setFormData({ ...formData, dueDayOfWeek: e.target.value })} className="neo-input w-full py-3.5 text-slate-900 text-sm font-black bg-transparent border-none focus:outline-none [&>option]:bg-white [&>option]:text-slate-900">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Reminders Section */}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">notifications</span>
                    <label className="text-sm font-bold text-slate-700">Enable Reminders</label>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, reminderEnabled: !formData.reminderEnabled })}
                    className={clsx("w-10 h-6 rounded-full relative transition-colors", formData.reminderEnabled ? "bg-primary" : "bg-slate-300")}
                    type="button"
                  >
                    <div className={clsx("absolute top-1 left-1 bg-white size-4 rounded-full shadow transition-transform", formData.reminderEnabled ? "translate-x-4" : "")}></div>
                  </button>
                </div>

                {formData.reminderEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-2 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Notify Me</label>
                      <div className="neo-inset flex items-center px-3 bg-transparent">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={formData.reminderDaysBefore}
                          onChange={(e) => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) || 0 })}
                          className="neo-input w-full py-3 text-slate-900 text-sm font-medium bg-transparent focus:outline-none"
                        />
                        <span className="text-xs text-slate-400 font-bold ml-1 whitespace-nowrap">days before</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">At Time</label>
                      <input
                        type="time"
                        value={formData.reminderTime}
                        onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                        className="neo-inset w-full p-3 text-slate-900 text-sm font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                {editingId && (
                  <button onClick={handleDelete} className="neo-btn px-5 py-3 rounded-xl text-red-500 font-black uppercase tracking-widest hover:bg-red-50 text-[10px] active:scale-95 transition-all">Eliminate</button>
                )}
                <div className="flex-1"></div>
                <button onClick={handleSave} className="neo-btn-primary px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Bill</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payday Modal */}
      {showPaydayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="neo-card w-full max-w-md overflow-hidden transform transition-all scale-100 p-0 border-2 border-white/50">
            <div className="bg-emerald-500 p-8 text-white text-center relative overflow-hidden">
              <span className="material-symbols-outlined text-9xl absolute -bottom-8 -right-8 opacity-20 rotate-12">payments</span>
              <h2 className="text-3xl font-bold relative z-10 text-shadow-sm">Payday Routine</h2>
              <p className="text-emerald-50 font-medium relative z-10 mt-1">Clear the board and relax.</p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1 text-center">
                  Type "i got paid" to confirm
                </label>
                <div className="neo-inset p-1.5 rounded-2xl bg-white">
                  <input
                    type="text"
                    className="w-full p-4 text-center font-black text-xl text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent uppercase tracking-wider"
                    placeholder="I GOT PAID"
                    value={paydayConfirmationText}
                    onChange={(e) => setPaydayConfirmationText(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <button onClick={handleConfirmPayday} disabled={paydayConfirmationText.toLowerCase() !== 'i got paid' || isProcessing} className="neo-btn-primary w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">
                  {isProcessing ? (
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                      <span>Execute Routine</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => setShowPaydayModal(false)} disabled={isProcessing} className="text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abort Sequence</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      <CommentModal
        isOpen={!!discussingBill}
        onClose={() => setDiscussingBillId(null)}
        title={discussingBill?.name || 'Bill'}
        comments={discussingBill?.comments || []}
        onAddComment={handleAddComment}
      />
    </div>
  );
}