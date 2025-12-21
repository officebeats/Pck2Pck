import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import CommentModal, { Comment } from '../components/CommentModal';
import { useBills, Bill as FirestoreBill } from '@/hooks/useBills';
import { useAuth } from '@/context/AuthContext';

// Use Firestore Bill type directly
type Bill = FirestoreBill;

type SortOption = 'date-asc' | 'date-desc' | 'amount-asc' | 'amount-desc';
type ViewFilter = 'Current Cycle' | 'Upcoming' | 'Paid History';

const CountdownTimer = ({ targetDate, status, isHeader = false }: { targetDate: string, status: string, isHeader?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      let diff = target - now;

      if (status === 'overdue') {
        diff = now - target;
      }

      if (diff < 0) diff = 0;

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate, status]);

  if (!timeLeft) return null;

  const isOverdue = status === 'overdue';
  const isPaid = status === 'paid';
  if (isPaid) return null;

  if (isHeader) {
    return (
      <div className={clsx(
        "flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest",
        status === 'overdue' || status === 'due_soon' ? "animate-pulse" : "text-slate-400"
      )}>
        <span className="material-symbols-outlined text-xs font-black">
          {isOverdue ? 'priority_high' : 'schedule'}
        </span>
        <span>
          {timeLeft.d}D {timeLeft.h.toString().padStart(2, '0')}H {timeLeft.m.toString().padStart(2, '0')}M
        </span>
      </div>
    );
  }

  return null;
};

export default function BillPayments() {
  const navigate = useNavigate();
  const { bills, loading, markAsPaid, updateBill } = useBills();

  const [filter, setFilter] = useState<ViewFilter>('Current Cycle');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-asc');

  // Modal States - IDs are now strings
  const [confirmingBillId, setConfirmingBillId] = useState<string | null>(null);
  const [viewingDetailsBillId, setViewingDetailsBillId] = useState<string | null>(null);
  const [actualPayAmount, setActualPayAmount] = useState<string>('');

  const [isPayAllModalOpen, setIsPayAllModalOpen] = useState(false);
  const [payAllConfirmationText, setPayAllConfirmationText] = useState('');

  const [discussingBillId, setDiscussingBillId] = useState<string | null>(null);
  const [showPaydayModal, setShowPaydayModal] = useState(false);
  const [paydayConfirmationText, setPaydayConfirmationText] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (filter === 'Paid History') {
      setSortOption('date-desc');
    } else {
      setSortOption('date-asc');
    }
  }, [filter]);

  const handlePayClick = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    setConfirmingBillId(bill.id);
    setActualPayAmount(bill.amount.toFixed(2));
  };

  const handleEditBill = (billId: string) => {
    navigate('/planning');
  };

  const confirmPayment = async () => {
    if (!confirmingBillId) return;
    setIsProcessing(true);
    try {
      await markAsPaid(confirmingBillId, parseFloat(actualPayAmount) || 0);
    } catch (e) {
      console.error(e);
      alert('Failed to pay bill');
    }
    setIsProcessing(false);
    setConfirmingBillId(null);
    setActualPayAmount('');
  };

  const filteredBills = bills
    .filter(bill => {
      const isSearchMatch = bill.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!isSearchMatch) return false;

      if (filter === 'Current Cycle') {
        return bill.cycle === 'current' && bill.status !== 'paid';
      }
      if (filter === 'Upcoming') {
        return bill.cycle === 'next' && bill.status !== 'paid';
      }
      if (filter === 'Paid History') {
        return bill.status === 'paid';
      }
      return false;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dueDateIso).getTime();
      const dateB = new Date(b.dueDateIso).getTime();

      switch (sortOption) {
        case 'date-asc': return dateA - dateB;
        case 'date-desc': return dateB - dateA;
        case 'amount-asc': return a.amount - b.amount;
        case 'amount-desc': return b.amount - a.amount;
        default: return 0;
      }
    });

  const confirmPayAll = async () => {
    setIsProcessing(true);
    // TODO: Batch update in firestore
    for (const bill of filteredBills) {
      await markAsPaid(bill.id, bill.amount);
    }
    setIsProcessing(false);
    setIsPayAllModalOpen(false);
    setPayAllConfirmationText('');
  };

  const handleConfirmPayday = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
    setShowPaydayModal(false);
    setPaydayConfirmationText('');
  };

  const handleAddComment = async (text: string) => {
    if (!discussingBillId) return;
    const bill = bills.find(b => b.id === discussingBillId);
    if (!bill) return;

    const newComment = {
      id: Date.now(),
      user: 'You',
      text,
      timestamp: 'Just now',
      isMe: true
    };

    // Naively update the comments array in firestore
    const updatedComments = [...(bill.comments || []), newComment];
    await updateBill(discussingBillId, { comments: updatedComments });
  };

  // Comments edit not fully supported in simple version yet
  const handleEditComment = (id: number, newText: string) => {
    console.log("Edit comment not implemented yet");
  };

  const totalCurrentCycle = bills.filter(b => b.cycle === 'current' && b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0);
  const totalNextCycle = bills.filter(b => b.cycle === 'next' && b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0);
  const totalPayAllAmount = filteredBills.reduce((sum, b) => sum + b.amount, 0);

  const billToPay = bills.find(b => b.id === confirmingBillId);
  const detailsBill = bills.find(b => b.id === viewingDetailsBillId);
  const discussingBill = bills.find(b => b.id === discussingBillId);

  const getAmountDiff = () => {
    if (!billToPay || !actualPayAmount) return null;
    const expected = billToPay.amount;
    const actual = parseFloat(actualPayAmount);
    if (isNaN(actual)) return null;
    const diff = actual - expected;
    const percent = (diff / expected) * 100;
    return { diff, percent };
  };
  const diffData = getAmountDiff();

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light font-sans transition-colors duration-200">
      <div className="sticky top-0 z-20 flex items-center bg-background-light/90 Backdrop-blur-md p-3 pb-2 justify-between border-b border-white/40 transition-colors md:p-6 md:pb-0">
        <button onClick={() => navigate(-1)} className="neo-btn flex size-8 shrink-0 items-center justify-center rounded-full text-slate-800 shadow-sm active:scale-95 transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-black leading-tight tracking-tight flex-1 text-center text-slate-900">Bills</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaydayModal(true)}
            className="neo-btn-primary px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            <span className="hidden sm:inline">Deposit</span>
          </button>
          <button onClick={() => navigate('/planning')} className="neo-btn size-8 flex items-center justify-center rounded-full text-primary shadow-sm active:scale-95 transition-all" title="Plan Paychecks">
            <span className="material-symbols-outlined text-lg font-black">event_repeat</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-2 md:px-6">
        <div className="neo-inset flex h-10 w-full md:w-auto items-center justify-center p-1 rounded-xl transition-all">
          {(['Current Cycle', 'Upcoming', 'Paid History'] as ViewFilter[]).map((item) => (
            <label key={item} className={clsx(
              "flex-1 flex cursor-pointer h-full px-2 items-center justify-center overflow-hidden rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 text-center relative",
              filter === item
                ? "bg-white shadow-sm text-primary"
                : "text-slate-500 hover:text-slate-700"
            )}>
              <span className="truncate w-full text-center relative z-10">{item}</span>
              <input
                checked={filter === item}
                className="invisible w-0 absolute"
                type="radio"
                name="bill_status_filter"
                onChange={() => setFilter(item)}
              />
            </label>
          ))}
        </div>

        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="material-symbols-outlined text-slate-500 text-sm font-black">search</span>
            </div>
            <input
              type="text"
              className="neo-inset block w-full py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-300 focus:outline-none transition-all font-black rounded-xl"
              placeholder="Filter bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="neo-card h-full appearance-none py-2.5 pl-3 pr-8 text-[9px] font-black uppercase tracking-widest text-slate-800 focus:outline-none transition-all cursor-pointer rounded-xl bg-white"
            >
              <option value="date-asc">Earliest</option>
              <option value="date-desc">Latest</option>
              <option value="amount-asc">Lowest</option>
              <option value="amount-desc">Highest</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <span className="material-symbols-outlined text-slate-400 text-sm font-black">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className={clsx("flex flex-col gap-3 px-4 py-2 pb-24", filter !== 'Paid History' ? "md:grid md:grid-cols-2 lg:grid-cols-2" : "md:max-w-2xl md:mx-auto")}>
        {filteredBills.length === 0 && (
          <div className="neo-inset flex flex-col items-center justify-center py-16 px-6 rounded-3xl col-span-full animate-fade-in opacity-80 bg-slate-50/50">
            <div className="neo-card size-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-md">
              <span className="material-symbols-outlined text-4xl text-slate-300 font-bold">
                {filter === 'Paid History' ? 'archive' : 'verified'}
              </span>
            </div>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2">
              {searchQuery ? "No matched bills" : (filter === 'Current Cycle' ? "All Paid" : filter === 'Upcoming' ? "No Upcoming Bills" : "No Paid History")}
            </h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center max-w-[280px] leading-relaxed">
              {searchQuery ? "Try refining your search parameters for better results." : "You've paid all bills for this cycle."}
            </p>
            {!searchQuery && (
              <button onClick={() => navigate('/planning')} className="mt-6 neo-btn-primary px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                Go to Planner
              </button>
            )}
          </div>
        )}

        {filteredBills.map((bill) => {
          if (filter === 'Paid History') {
            return (
              <div
                key={bill.id}
                onClick={() => setViewingDetailsBillId(bill.id)}
                className="neo-card group flex items-center gap-3 p-3 hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer bg-white"
              >
                <div className="neo-inset flex items-center justify-center size-10 rounded-xl bg-white shrink-0 text-emerald-500">
                  <span className="material-symbols-outlined text-xl font-bold">check_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-black text-slate-900 text-xs tracking-tight truncate">{bill.name}</h4>
                    <span className="font-black text-slate-900 text-xs tabular-nums">${bill.amount.toFixed(0)}</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{bill.dueDate} • {bill.category}</p>
                </div>
                <div className="flex items-center" onClick={(e) => { e.stopPropagation(); setDiscussingBillId(bill.id); }}>
                  <button className="neo-btn rounded-lg p-2 text-slate-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg font-bold">chat_bubble</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={bill.id} onClick={() => setViewingDetailsBillId(bill.id)} className={clsx(
              "neo-card flex flex-col overflow-hidden relative transition-all duration-500 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]",
              bill.status === 'overdue' ? "ring-2 ring-red-500/20" : ""
            )}>

              {bill.status !== 'paid' && (
                <div className={clsx("w-full py-1.5 flex justify-center items-center gap-2 border-b border-white/40",
                  bill.status === 'overdue'
                    ? "bg-red-500/10"
                    : bill.status === 'due_soon'
                      ? "bg-orange-500/10"
                      : "bg-slate-50/50"
                )}>
                  <CountdownTimer targetDate={bill.dueDateIso} status={bill.status} isHeader={true} />
                </div>
              )}

              <div className="flex items-center gap-3 p-4">
                <div className="flex items-center gap-3 w-full relative">
                  <div className="neo-inset p-0.5 rounded-full shrink-0">
                    <div className={clsx("neo-card flex items-center justify-center rounded-full size-10 shadow-sm bg-white",
                      bill.status === 'overdue' ? "text-red-500" : "text-primary")}>
                      <span className={clsx("material-symbols-outlined text-xl font-bold")}>{bill.icon}</span>
                    </div>
                  </div>
                  {/* Owner Avatar Badge */}
                  {bill.owner && bill.owner !== 'Joint' && (
                    <div className="absolute -left-1 -top-1 size-5 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-md z-10">
                      <span className="text-[9px] font-black text-white">{bill.owner.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex flex-col justify-center flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-900 text-sm font-black tracking-tight truncate leading-none">{bill.name}</p>
                      {(bill.status === 'overdue' || bill.status === 'due_soon') && (
                        <span className="flex size-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className={clsx(
                        "text-[9px] font-black uppercase tracking-[0.1em] leading-none",
                        bill.status === 'overdue' ? "text-red-500" :
                          bill.status === 'due_soon' ? "text-orange-500" : "text-slate-400"
                      )}>
                        ${bill.amount.toFixed(0)} Due
                      </p>
                      <span className="text-slate-200 text-[9px]">•</span>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate leading-none max-w-[80px]">{bill.companyName || bill.dueDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDiscussingBillId(bill.id); }}
                      className="neo-btn flex items-center justify-center size-8 rounded-xl text-slate-300 hover:text-primary active:scale-90 transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base font-black">chat_bubble</span>
                    </button>

                    {bill.status !== 'paid' ? (
                      <button
                        onClick={(e) => handlePayClick(e, bill)}
                        className={clsx(
                          "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all h-8 shadow-lg active:scale-95",
                          bill.status === 'overdue'
                            ? "neo-btn-primary"
                            : "neo-btn text-primary"
                        )}
                      >
                        Pay
                      </button>
                    ) : (
                      <div className="neo-inset px-2.5 py-1 rounded-lg text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 bg-emerald-50/30 h-8">
                        <span className="material-symbols-outlined text-[10px] font-black">check_circle</span> Settled
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pay All Confirmation Modal */}
      {isPayAllModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="neo-card w-full max-w-sm overflow-hidden p-8 border-2 border-white/50">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="neo-inset flex items-center justify-center rounded-full size-20 text-primary mb-6 shadow-md bg-white">
                <span className="material-symbols-outlined text-4xl font-black">checklist</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">Pay All Bills</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{filteredBills.length} Bills Selected</p>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-6 neo-inset flex flex-col items-center justify-center mb-8">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Combined Total</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">${totalPayAllAmount.toLocaleString()}</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <button
                  onClick={() => !isProcessing && setIsPayAllModalOpen(false)}
                  disabled={isProcessing}
                  className="neo-btn flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPayAll}
                  disabled={isProcessing}
                  className="neo-btn-primary flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-30 flex items-center justify-center gap-2 active:scale-95 transition-all text-white"
                >
                  {isProcessing ? (
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  ) : (
                    'Confirm All'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Details / View Card Modal */}
      {detailsBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="neo-card w-full max-w-sm overflow-hidden p-6 animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={clsx("neo-inset flex items-center justify-center rounded-full size-12", "text-primary bg-primary/10")}>
                  <span className={clsx("material-symbols-outlined text-2xl")}>{detailsBill.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{detailsBill.name}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase">{detailsBill.status === 'paid' ? 'PAID' : 'DUE'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setDiscussingBillId(detailsBill.id); }} className="neo-btn rounded-full p-2 text-gray-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
                </button>
                <button onClick={() => setViewingDetailsBillId(null)} className="neo-btn rounded-full p-2">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-2 mb-6 border-b border-gray-200">
              <p className="text-3xl font-bold text-slate-900">${detailsBill.amount.toFixed(2)}</p>
              <p className="text-sm text-slate-500 mt-1">{detailsBill.companyName || 'Bill'}</p>
            </div>

            <div className="space-y-5">
              {/* Core Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="neo-card p-3 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Due Date</span>
                  <span className="font-bold text-slate-800">{detailsBill.dueDate}</span>
                </div>
                <div className="neo-card p-3 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                  <span className={clsx("font-bold capitalize",
                    detailsBill.status === 'overdue' ? "text-red-500" :
                      detailsBill.status === 'due_soon' ? "text-orange-500" : "text-slate-800")}>
                    {detailsBill.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Shared Creds */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Shared Details</span>
                </div>

                {detailsBill.accountNumber && (
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <p className="text-xs font-medium text-slate-500">Account #</p>
                    <p className="font-mono font-bold text-slate-900 select-all">{detailsBill.accountNumber}</p>
                  </div>
                )}

                {(detailsBill.username || detailsBill.password) && (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    {detailsBill.username && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Username</p>
                        <p className="font-mono text-sm font-bold text-slate-900 select-all truncate">{detailsBill.username}</p>
                      </div>
                    )}
                    {detailsBill.password && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Password</p>
                        <p className="font-mono text-sm font-bold text-slate-900 select-all truncate">{detailsBill.password}</p>
                      </div>
                    )}
                  </div>
                )}

                {!detailsBill.accountNumber && !detailsBill.username && !detailsBill.password && (
                  <p className="text-xs text-slate-400 italic">No credentials shared.</p>
                )}
              </div>

              {detailsBill.notes && (
                <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                  <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Shared Notes</p>
                  <p className="text-sm text-slate-700 italic">"{detailsBill.notes}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => navigate('/planning')}
                  className="neo-btn flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Edit
                </button>
                {detailsBill.status !== 'paid' && (
                  <button
                    onClick={(e) => {
                      setViewingDetailsBillId(null);
                      handlePayClick(e, detailsBill);
                    }}
                    className="neo-btn-primary flex-1 py-3 rounded-xl font-bold"
                  >
                    Pay Bill
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Pay Modal */}
      {billToPay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="neo-card w-full max-w-sm overflow-hidden p-8 border-2 border-white/50">
            <div className="flex items-center gap-5 mb-8">
              <div className="neo-inset p-1 rounded-full">
                <div className={clsx("neo-card flex items-center justify-center rounded-full size-14 shadow-sm bg-white", "text-primary")}>
                  <span className={clsx("material-symbols-outlined text-3xl font-bold")}>{billToPay.icon}</span>
                </div>
              </div>
              <div className="ml-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{billToPay.name}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Ready to pay</p>
              </div>
            </div>

            <div className="mb-8 space-y-6">
              <div className="bg-slate-50/50 rounded-2xl p-6 neo-inset flex flex-col items-center justify-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Bill Amount</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">${billToPay.amount.toFixed(2)}</p>
              </div>

              <div className="px-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Actual Amount Paid</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={actualPayAmount}
                    onChange={(e) => setActualPayAmount(e.target.value)}
                    className="neo-inset w-full p-4 text-xl font-black text-slate-900 rounded-2xl focus:outline-none placeholder:text-slate-200"
                    placeholder="0.00"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm uppercase tracking-widest pointer-events-none">USD</div>
                </div>
              </div>

              {diffData && diffData.diff !== 0 && (
                <div className={clsx(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl animate-fade-in neo-inset text-[10px] font-black uppercase tracking-widest",
                  diffData.diff > 0 ? "text-red-500 bg-red-50/30" : "text-emerald-500 bg-emerald-50/30"
                )}>
                  <span className="material-symbols-outlined text-lg font-black">
                    {diffData.diff > 0 ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  <span>
                    Variance: {diffData.diff > 0 ? '+' : ''}{diffData.diff.toFixed(2)} ({diffData.diff > 0 ? '+' : ''}{diffData.percent.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => !isProcessing && setConfirmingBillId(null)}
                disabled={isProcessing}
                className="neo-btn flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 active:scale-95 transition-all shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                disabled={isProcessing || !actualPayAmount}
                className="neo-btn-primary flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-30 flex items-center justify-center gap-2 active:scale-95 transition-all text-white"
              >
                {isProcessing ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  'Confirm Bill Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payday Modal */}
      {showPaydayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
          <div className="neo-card w-full max-w-md overflow-hidden p-0 border-2 border-white/50 shadow-3xl">
            <div className="bg-emerald-500 p-10 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined text-[10rem] absolute -bottom-10 -right-10 opacity-10 rotate-12 font-black">savings</span>
              <h2 className="text-4xl font-black relative z-10 tracking-tighter text-shadow-lg">It's Payday!</h2>
              <p className="text-emerald-50 font-medium relative z-10 mt-3">Confirm your deposit and update your budget.</p>
            </div>

            <div className="p-10 bg-background-light space-y-4">
              <button
                onClick={handleConfirmPayday}
                disabled={isProcessing}
                className="neo-btn-primary w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-20 transition-all active:scale-[0.97] shadow-2xl text-white"
              >
                {isProcessing ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined font-black">check_circle</span>
                    <span>Confirm Deposit</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPaydayModal(false)}
                disabled={isProcessing}
                className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Modal - Replaced with Component */}
      <CommentModal
        isOpen={!!discussingBill}
        onClose={() => setDiscussingBillId(null)}
        title={discussingBill?.name || 'Bill'}
        comments={discussingBill?.comments || []}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
      />
    </div>
  );
}