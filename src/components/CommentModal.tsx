import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface Comment {
    id: number;
    user: string;
    avatar?: string;
    text: string;
    timestamp: string;
    isMe: boolean;
}

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    comments: Comment[];
    onAddComment: (text: string) => void;
    onEditComment?: (id: number, newText: string) => void;
}

export default function CommentModal({ isOpen, onClose, title, comments, onAddComment, onEditComment }: CommentModalProps) {
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [isOpen, comments]);

    const handleSend = () => {
        if (!newComment.trim()) return;
        onAddComment(newComment);
        setNewComment('');
    };

    const startEditing = (comment: Comment) => {
        setEditingId(comment.id);
        setEditText(comment.text);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditText('');
    };

    const saveEdit = (id: number) => {
        if (onEditComment && editText.trim()) {
            onEditComment(id, editText);
        }
        setEditingId(null);
        setEditText('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
            <div className="neo-card w-full max-w-md h-[85vh] sm:h-[650px] flex flex-col transform transition-transform animate-slide-up sm:animate-none overflow-hidden bg-background-light rounded-t-3xl sm:rounded-3xl border-2 border-white/50">
                <div className="flex items-center justify-between p-5 border-b border-white/40 bg-background-light/80 Backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="neo-inset p-0.5 rounded-full">
                            <div className="neo-card flex items-center justify-center size-10 rounded-full bg-white text-primary shadow-sm">
                                <span className="material-symbols-outlined text-xl font-black">forum</span>
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Intelligence Feed</h3>
                            <p className="text-[9px] font-black text-slate-400 truncate max-w-[180px] uppercase tracking-widest mt-1.5 opacity-70">{title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="neo-btn rounded-full size-9 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined text-xl font-black">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-background-light/50">
                    {comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                            <div className="neo-inset size-20 rounded-full flex items-center justify-center mb-6 bg-white/50">
                                <span className="material-symbols-outlined text-4xl text-slate-200 font-bold">chat_bubble_outline</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Silence is Golden</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Awaiting first transmission.</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className={clsx("flex gap-4 max-w-[85%] animate-fade-in", comment.isMe ? "ml-auto flex-row-reverse" : "")}>
                                {!comment.isMe && (
                                    <div className="neo-inset p-0.5 rounded-full shrink-0 h-fit">
                                        <div className="size-9 rounded-full bg-white flex items-center justify-center overflow-hidden neo-card shadow-sm">
                                            {comment.avatar ? (
                                                <img src={comment.avatar} alt={comment.user} className="size-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-black text-primary uppercase">{comment.user[0]}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={clsx("flex flex-col gap-1.5 min-w-0", comment.isMe ? "items-end" : "items-start")}>
                                    {editingId === comment.id ? (
                                        <div className="flex flex-col items-end gap-2 w-full min-w-[200px]">
                                            <input
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(comment.id)}
                                                className="w-full p-4 rounded-2xl text-sm font-black text-slate-900 focus:outline-none neo-inset bg-white"
                                                autoFocus
                                            />
                                            <div className="flex gap-3 px-1">
                                                <button onClick={cancelEditing} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Abort</button>
                                                <button onClick={() => saveEdit(comment.id)} className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary transition-colors">Synchronize</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={clsx(
                                                "px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed break-words transition-all duration-300",
                                                comment.isMe
                                                    ? "bg-primary text-white rounded-br-none shadow-xl shadow-primary/20"
                                                    : "bg-white text-slate-800 rounded-bl-none neo-card"
                                            )}>
                                                <p className="tracking-tight">{comment.text}</p>
                                            </div>
                                            <div className={clsx("flex items-center gap-3 px-2", comment.isMe ? "flex-row-reverse" : "flex-row")}>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{comment.timestamp}</span>
                                                {comment.isMe && onEditComment && (
                                                    <button
                                                        onClick={() => startEditing(comment)}
                                                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef}></div>
                </div>

                <div className="p-4 bg-background-light border-t border-white/40">
                    <div className="flex gap-3 items-center">
                        <div className="neo-inset flex-1 rounded-2xl bg-white p-1">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Transmit message..."
                                className="w-full px-5 py-4 text-sm font-black text-slate-900 focus:outline-none bg-transparent placeholder:text-slate-200"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!newComment.trim()}
                            className="neo-btn-primary flex items-center justify-center rounded-2xl size-14 disabled:opacity-30 disabled:grayscale transition-all shadow-xl active:scale-90 text-white"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}