import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface NotificationItem {
  id: number;
  type: 'bill' | 'warning' | 'income' | 'chat' | 'goal';
  title: string;
  description: string;
  time: string;
  dateLabel: 'Today' | 'Yesterday' | 'This Week' | 'Earlier';
  icon: string;
  iconBg: string;
  iconColor: string;
  link?: string;
  read: boolean;
  archived: boolean;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');
  // State with Persistence
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('pchk_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pchk_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleArchive = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));
  };

  const handleUnarchive = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: false } : n));
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => activeTab === 'inbox' ? !n.archived : n.archived);

  // Group by date label
  const groupedNotifications = filteredNotifications.reduce((acc, note) => {
    if (!acc[note.dateLabel]) acc[note.dateLabel] = [];
    acc[note.dateLabel].push(note);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  const labels: ('Today' | 'Yesterday' | 'This Week' | 'Earlier')[] = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  return (
    <div className="relative flex h-screen min-h-screen w-full flex-col bg-background-light group/design-root overflow-x-hidden font-sans transition-colors duration-200">
      {/* Top App Bar */}
      <header className="flex shrink-0 items-center justify-between bg-background-light/90 Backdrop-blur-md p-4 pb-2 sticky top-0 z-20 border-b border-white/40 transition-colors">
        <div className="flex shrink-0 items-center">
          <button onClick={() => navigate(-1)} className="neo-btn flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </button>
        </div>
        <h1 className="text-lg font-black leading-tight tracking-tight text-slate-900 flex-1 text-center">Alert Center</h1>
        <div className="flex items-center justify-end">
          <button className="neo-btn flex size-9 items-center justify-center rounded-full text-slate-400 active:scale-95 shadow-sm transition-all">
            <span className="material-symbols-outlined text-xl font-black">settings</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-3">
        <div className="neo-inset flex p-1 rounded-xl h-10">
          <button
            onClick={() => setActiveTab('inbox')}
            className={clsx(
              "flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
              activeTab === 'inbox'
                ? "bg-white text-primary shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            Live Feed
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={clsx(
              "flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
              activeTab === 'archived'
                ? "bg-white text-primary shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            Archive
          </button>
        </div>
      </div>

      {/* Notification List */}
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 px-4 py-3">

          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
              <div className="neo-inset size-24 rounded-full flex items-center justify-center mb-6 bg-slate-50/50">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  {activeTab === 'inbox' ? 'notifications_off' : 'inventory_2'}
                </span>
              </div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2">
                {activeTab === 'inbox' ? 'Clean Slate' : 'Empty Vault'}
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest max-w-[200px] leading-relaxed">
                {activeTab === 'inbox' ? 'You have no pending alerts at this moment.' : 'Your archived history is currently empty.'}
              </p>
            </div>
          ) : (
            labels.map(label => {
              const group = groupedNotifications[label];
              if (!group || group.length === 0) return null;

              return (
                <div key={label} className="animate-fade-in">
                  <div className="px-1 py-1 pt-4 first:pt-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">{label}</p>
                  </div>
                  <div className="flex flex-col gap-3 mt-1.5">
                    {group.map(note => (
                      <div
                        key={note.id}
                        onClick={() => note.link && navigate(note.link)}
                        className={clsx(
                          "group relative flex items-center gap-4 bg-white p-4 rounded-2xl justify-between transition-all duration-300 border border-transparent",
                          "neo-card hover:shadow-lg active:scale-[0.99]",
                          !note.read && activeTab === 'inbox' && "border-primary/10 bg-primary/[0.02]",
                          note.link ? 'cursor-pointer' : ''
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={clsx("neo-inset flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white", note.iconBg, note.iconColor)}>
                            <span className="material-symbols-outlined text-2xl font-bold">{note.icon}</span>
                          </div>
                          <div className="flex flex-col justify-center min-w-0">
                            <p className="text-sm font-black leading-tight text-slate-900 tracking-tight line-clamp-1">{note.title}</p>
                            <p className="text-[10px] font-black leading-tight text-slate-400 mt-1 uppercase tracking-widest line-clamp-2">{note.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 self-start shrink-0">
                          <p className="text-[9px] font-black leading-normal text-slate-300 uppercase tracking-widest">{note.time}</p>
                          {!note.read && activeTab === 'inbox' && <div className="size-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>}
                        </div>

                        {/* Actions Overlay */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-1.5 border border-white animate-fade-in">
                          {activeTab === 'inbox' ? (
                            <button
                              onClick={(e) => handleArchive(e, note.id)}
                              className="size-9 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                              title="Archive"
                            >
                              <span className="material-symbols-outlined text-lg font-black">archive</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => handleUnarchive(e, note.id)}
                                className="size-9 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                                title="Unarchive"
                              >
                                <span className="material-symbols-outlined text-lg font-black">unarchive</span>
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, note.id)}
                                className="size-9 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-lg font-black">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

        </div>
      </main>
    </div>
  );
}