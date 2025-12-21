import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import CommentModal, { Comment } from '../components/CommentModal';

interface AssignedBill {
    id: number;
    name: string;
    amount: number;
    dueDate: string;
    status: 'overdue' | 'due_soon' | 'paid' | 'upcoming';
    icon: string;
    comments?: Comment[];
    // Shared Details Mock
    companyName?: string;
    website?: string;
    username?: string;
    password?: string;
    accountNumber?: string;
    notes?: string;
}

interface ActivityItem {
    id: number;
    action: string;
    target: string;
    time: string;
    icon: string;
}

export default function MemberProfile() {
    const navigate = useNavigate();
    const { id } = useParams();

    // Mock data simulation based on ID
    const isUrgentUser = id === '1';

    const member = {
        name: isUrgentUser ? 'Sarah' : (id === '0' ? 'You' : 'Maya'),
        role: id === '0' ? 'Family Admin' : 'Member',
        avatar: id === '0'
            ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces'
            : (id === '1' ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces'
                : 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces'),
        totalCommitment: 850.00,
        paidThisCycle: 400.00,
    };

    const [assignedBills, setAssignedBills] = useState<AssignedBill[]>([]);
    const [availableBills, setAvailableBills] = useState<AssignedBill[]>([]);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'urgent' | 'upcoming' | 'paid'>('all');
    const [discussingBillId, setDiscussingBillId] = useState<number | null>(null);
    const [viewingDetailsBillId, setViewingDetailsBillId] = useState<number | null>(null);

    const pendingAmount = member.totalCommitment - member.paidThisCycle;
    const progressPercent = (member.paidThisCycle / member.totalCommitment) * 100;

    const recentActivity: ActivityItem[] = [];

    const urgentBills = assignedBills.filter(b => b.status === 'overdue' || b.status === 'due_soon');

    const handleAssignBill = (bill: AssignedBill) => {
        setAssignedBills([...assignedBills, bill]);
        setAvailableBills(availableBills.filter(b => b.id !== bill.id));
        setIsAssignModalOpen(false);
    };

    const handleAddComment = (text: string) => {
        if (!discussingBillId) return;
        const newComment: Comment = {
            id: Date.now(),
            user: 'You',
            text,
            timestamp: 'Just now',
            isMe: true
        };
        setAssignedBills(prev => prev.map(b => b.id === discussingBillId ? { ...b, comments: [...(b.comments || []), newComment] } : b));
    };

    const filteredBills = assignedBills.filter(bill => {
        if (filter === 'all') return true;
        if (filter === 'paid') return bill.status === 'paid';
        if (filter === 'urgent') return bill.status === 'overdue' || bill.status === 'due_soon';
        if (filter === 'upcoming') return bill.status === 'upcoming';
        return true;
    });

    const discussingBill = assignedBills.find(b => b.id === discussingBillId);
    const detailsBill = assignedBills.find(b => b.id === viewingDetailsBillId);

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light font-sans transition-colors duration-200">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center bg-background-light/90 Backdrop-blur-md p-4 pb-2 justify-between border-b border-white/40 transition-colors md:p-6 md:pb-0">
                <button onClick={() => navigate(-1)} className="neo-btn flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 shadow-sm">
                    <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-black leading-tight tracking-tight flex-1 text-center text-slate-900">Member Analytics</h1>
                <div className="size-9"></div>
            </div>

            <main className="flex-1 p-4 md:p-6 pb-24 space-y-4">
                {/* Profile Hero - Compact */}
                <div className="neo-card p-5 flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                        <span className="material-symbols-outlined text-9xl font-bold">person</span>
                    </div>
                    <div className="relative shrink-0">
                        <div className="neo-inset p-1 rounded-full">
                            <img src={member.avatar} alt={member.name} className="size-20 rounded-full object-cover border-2 border-white shadow-sm" />
                        </div>
                        {urgentBills.length > 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-1 rounded-full border-2 border-white animate-pulse shadow-lg ring-4 ring-red-50">
                                <span className="material-symbols-outlined text-[10px] font-black block">priority_high</span>
                            </div>
                        )}
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{member.name}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">{member.role}</p>
                    </div>
                </div>

                {/* Urgency Bubble / Alert Section */}
                {urgentBills.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 animate-fade-in">
                        <div className="flex items-start gap-3">
                            <div className="bg-red-100 text-red-600 p-1.5 rounded-full shrink-0">
                                <span className="material-symbols-outlined text-lg">notification_important</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-red-700 text-sm">Action Required</h3>
                                <p className="text-xs text-red-600/80 mt-0.5">
                                    {member.name} has {urgentBills.length} bills pending.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Commitment</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">${member.totalCommitment.toFixed(0)}</p>
                        <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mt-1">Per Paycheck</p>
                    </div>
                    <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Still Due</p>
                        <p className={clsx("text-2xl font-black tracking-tight", pendingAmount > 0 ? "text-orange-500" : "text-emerald-500")}>
                            ${pendingAmount.toFixed(0)}
                        </p>
                        <div className="w-full neo-inset h-2 rounded-full mt-3 overflow-hidden p-[1px] bg-slate-100">
                            <div className="bg-primary h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Current Paycheck Assignments */}
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest ml-1">Assigned Workload</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-primary px-2.5 py-1 rounded-full neo-inset bg-slate-50/50 uppercase tracking-tighter">{assignedBills.length} Bills</span>
                            <button
                                onClick={() => setIsAssignModalOpen(true)}
                                className="neo-btn flex items-center justify-center size-8 rounded-full text-primary shadow-sm active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-lg font-black">add</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 px-1">
                        {(['all', 'urgent', 'upcoming', 'paid'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300",
                                    filter === f
                                        ? "neo-card bg-slate-800 text-white"
                                        : "neo-btn-flat text-slate-400"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        {filteredBills.map(bill => (
                            <div
                                key={bill.id}
                                onClick={() => setViewingDetailsBillId(bill.id)}
                                className="neo-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "neo-inset flex items-center justify-center size-12 rounded-2xl bg-white",
                                        bill.status === 'overdue' ? "text-red-500" :
                                            bill.status === 'due_soon' ? "text-orange-500" :
                                                bill.status === 'paid' ? "text-emerald-500" : "text-slate-400"
                                    )}>
                                        <span className="material-symbols-outlined text-2xl font-bold">{bill.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm tracking-tight">{bill.name}</p>
                                        <p className={clsx("text-[9px] font-black uppercase tracking-widest mt-1",
                                            bill.status === 'overdue' ? "text-red-500" :
                                                bill.status === 'due_soon' ? "text-orange-500" : "text-slate-400"
                                        )}>
                                            {bill.status === 'overdue' ? `Overdue: ${bill.dueDate}` :
                                                bill.status === 'due_soon' ? `Upcoming: ${bill.dueDate}` :
                                                    bill.status === 'paid' ? 'Paid / Settled' : `Due: ${bill.dueDate}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="font-black text-slate-900 text-base tabular-nums leading-tight tracking-tight">${bill.amount.toFixed(0)}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDiscussingBillId(bill.id); }}
                                        className="text-slate-300 hover:text-primary transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredBills.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 px-6 text-center neo-inset rounded-2xl animate-fade-in opacity-70">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">list_alt</span>
                                {assignedBills.length === 0 ? (
                                    <>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No workload assigned</p>
                                        <button
                                            onClick={() => setIsAssignModalOpen(true)}
                                            className="neo-btn-primary px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4 shadow-md"
                                        >
                                            Assign Bill
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No {filter} items found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="pt-4">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest ml-1 mb-3">Live Feed</h3>
                    <div className="neo-card p-2 flex flex-col gap-1">
                        {recentActivity.length > 0 ? recentActivity.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors rounded-xl group/item">
                                <div className="neo-inset size-8 flex items-center justify-center rounded-lg bg-white shrink-0 group-hover/item:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-slate-400 text-base">{item.icon}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 flex-1 leading-relaxed">
                                    <span className="font-black text-slate-900 tracking-tight">{item.action}</span> {item.target}
                                </p>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{item.time}</span>
                            </div>
                        )) : (
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center py-6">No recent movements</p>
                        )}
                    </div>
                </div>

            </main>

            {/* Floating Action / Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light/95 backdrop-blur-md border-t border-white/40 md:pl-64 z-30">
                <div className="max-w-7xl mx-auto flex gap-4">
                    <button
                        onClick={() => navigate('/chat')}
                        className="neo-btn-primary flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl"
                    >
                        <span className="material-symbols-outlined text-xl">forum</span>
                        Message {member.name}
                    </button>
                    <button className="neo-btn size-14 flex items-center justify-center rounded-2xl text-slate-400 shadow-md active:scale-95">
                        <span className="material-symbols-outlined text-2xl font-black">more_horiz</span>
                    </button>
                </div>
            </div>

            {/* Assign Bill Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-md p-0 pb-20 sm:p-4 animate-fade-in">
                    <div className="neo-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl transform transition-transform animate-slide-up sm:animate-none border-2 border-white/50">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                Pick a Bill for {member.name}
                            </h2>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="neo-btn rounded-full p-2 text-slate-400 active:scale-90 transition-all"
                            >
                                <span className="material-symbols-outlined font-black">close</span>
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-1 pb-4">
                            {availableBills.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 neo-inset rounded-2xl">
                                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-2">assignment_turned_in</span>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Board is clear</p>
                                </div>
                            ) : (
                                availableBills.map(bill => (
                                    <div
                                        key={bill.id}
                                        onClick={() => handleAssignBill(bill)}
                                        className="neo-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all"
                                    >
                                        <div className="neo-inset flex items-center justify-center size-11 rounded-2xl bg-white text-primary">
                                            <span className="material-symbols-outlined text-2xl font-bold">{bill.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 text-sm tracking-tight">{bill.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due: {bill.dueDate}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className="font-black text-slate-900 text-base tabular-nums tracking-tight">${bill.amount.toFixed(0)}</p>
                                            <div className="neo-btn size-8 flex items-center justify-center rounded-full text-emerald-500 shadow-sm">
                                                <span className="material-symbols-outlined font-black">add</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Shared Details / View Card Modal */}
            {detailsBill && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="neo-card w-full max-w-sm overflow-hidden p-6 animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="neo-inset p-1 rounded-full">
                                    <div className={clsx("neo-card flex items-center justify-center rounded-full size-14 shadow-sm bg-white", "text-primary")}>
                                        <span className={clsx("material-symbols-outlined text-3xl font-bold")}>{detailsBill.icon}</span>
                                    </div>
                                </div>
                                <div className="ml-1">
                                    <h3 className="font-black text-slate-900 text-xl tracking-tighter leading-none">{detailsBill.name}</h3>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1.5">{detailsBill.status === 'paid' ? 'SETTLED' : 'ACTIVE LIABILITY'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setDiscussingBillId(detailsBill.id); }} className="neo-btn rounded-full p-2.5 text-slate-400 hover:text-primary active:scale-90 transition-all shadow-sm">
                                    <span className="material-symbols-outlined text-xl font-black">chat_bubble</span>
                                </button>
                                <button onClick={() => setViewingDetailsBillId(null)} className="neo-btn rounded-full p-2.5 active:scale-90 transition-all shadow-sm">
                                    <span className="material-symbols-outlined text-xl font-black">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 neo-inset flex flex-col items-center justify-center mb-8">
                            <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">${detailsBill.amount.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{detailsBill.companyName || 'Bill Breakdown'}</p>
                        </div>

                        <div className="space-y-5">
                            {/* Core Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</span>
                                    <span className="font-black text-slate-800 text-sm tracking-tight">{detailsBill.dueDate}</span>
                                </div>
                                <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                    <span className={clsx("font-black text-sm tracking-tight uppercase",
                                        detailsBill.status === 'overdue' ? "text-red-500" :
                                            detailsBill.status === 'due_soon' ? "text-orange-500" : "text-emerald-500")}>
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
                            <div className="flex gap-4 pt-6">
                                <button
                                    onClick={() => navigate('/planning')}
                                    className="neo-btn-primary flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all text-white"
                                >
                                    Manage Bill
                                </button>
                                <button
                                    onClick={() => setViewingDetailsBillId(null)}
                                    className="neo-btn px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm active:scale-95 transition-all text-slate-400"
                                >
                                    Dismiss
                                </button>
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