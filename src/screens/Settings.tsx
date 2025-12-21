import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useHousehold, HouseholdMember } from '@/hooks/useHousehold';
import { useToast } from '@/components/Toast';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
export default function Settings() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showError, showSuccess } = useToast();
    const { members, isAdmin, removeMember, sendInvite, updateHouseholdName, household } = useHousehold();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local state for edits
    const [name, setName] = useState('User');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Invite state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', contact: '' });
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.displayName || 'User');
            setEmail(user.email || '');
            if (user.photoURL) setAvatar(user.photoURL);
        }
    }, [user]);

    const handleSignOut = async () => {
        await logout();
        navigate('/');
    };

    const handleResetData = async () => {
        if (window.confirm("Clear all local data and sign out? Cloud data will remain safe.")) {
            const keysToRemove = [
                'pchk_dashboard_bills', 'pchk_planning_bills',
                'pchk_recurring_bills', 'pchk_income_sources',
                'pchk_chats', 'pchk_bill_payments'
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            await logout();
            navigate('/');
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            showError('Invalid file type', 'Please upload an image file.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showError('File too large', 'Image must be under 2MB.');
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await updateProfile(user, { photoURL: downloadURL });
            setAvatar(downloadURL);
            showSuccess('Profile Updated', 'Your profile picture has been updated.');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showError('Upload Failed', 'There was an error updating your profile picture.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendInvite = async () => {
        if (!inviteData.contact) return;

        setIsInviting(true);
        try {
            const isEmail = inviteData.contact.includes('@');
            await sendInvite({
                name: inviteData.name,
                [isEmail ? 'email' : 'phone']: inviteData.contact
            });
            showSuccess('Invite Sent', `An invitation has been sent to ${inviteData.name || inviteData.contact}.`);
            setShowInviteModal(false);
            setInviteData({ name: '', contact: '' });
        } catch (error) {
            showError('Invite Failed', 'Could not send invitation. Please try again.');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (member: HouseholdMember) => {
        if (window.confirm(`Are you sure you want to remove ${member.name} from your household?`)) {
            try {
                await removeMember(member.id);
                showSuccess('Member Removed', `${member.name} has been removed.`);
            } catch (error) {
                showError('Error', 'Could not remove member.');
            }
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light font-sans transition-colors duration-200">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between bg-background-light/95 backdrop-blur-md p-4 pb-2 md:p-6 md:pb-4 border-b border-white/40 transition-colors">
                <button onClick={() => navigate(-1)} className="neo-btn flex size-9 shrink-0 items-center justify-center text-slate-800 rounded-full md:hidden active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                </button>
                <h1 className="text-slate-900 text-lg font-black leading-tight tracking-tight flex-1 text-center md:text-left">Control Panel</h1>
                <div className="size-9 md:hidden"></div>
            </div>

            <main className="flex-1 p-4 md:p-6 space-y-6 pb-24">

                {/* Profile Section */}
                <section className="animate-fade-in">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Identity</h2>
                    <div className="neo-card p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                onClick={handleAvatarClick}
                                className="relative group cursor-pointer neo-card p-1 rounded-full overflow-hidden"
                            >
                                <img
                                    src={avatar}
                                    alt="Profile"
                                    className={clsx(
                                        "size-16 rounded-full object-cover border-2 border-white shadow-sm transition-all",
                                        isUploading && "opacity-30 blur-sm"
                                    )}
                                />
                                {isUploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="size-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                        <span className="material-symbols-outlined text-primary text-xl font-bold">photo_camera</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="neo-inset w-full p-2.5 rounded-xl text-sm font-black text-slate-900 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Coordinates</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="neo-inset w-full p-2.5 rounded-xl text-sm font-black text-slate-900 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Household Section */}
                <section className="animate-fade-in delay-100">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Household Management</h2>
                        {isAdmin && (
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                            >
                                Invite User
                            </button>
                        )}
                    </div>

                    <div className="neo-card divide-y divide-slate-100">
                        {members.map(member => (
                            <div key={member.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="neo-card p-0.5 rounded-full shrink-0">
                                        <img
                                            src={member.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                            alt={member.name}
                                            className="size-10 rounded-full object-cover border border-white"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{member.name}</p>
                                            <span className={clsx(
                                                "text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest",
                                                member.role === 'admin' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {member.role}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{member.status}</p>
                                    </div>
                                </div>
                                {isAdmin && member.role !== 'admin' && (
                                    <button
                                        onClick={() => handleRemoveMember(member)}
                                        className="size-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">person_remove</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* App Preferences */}
                <section className="animate-fade-in delay-150">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">System</h2>
                    <div className="neo-card overflow-hidden divide-y divide-slate-100">

                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="neo-inset size-9 rounded-xl flex items-center justify-center text-primary bg-primary/5">
                                    <span className="material-symbols-outlined text-lg">notifications</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Bill Reminders</span>
                            </div>
                            <button
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={clsx("w-10 h-5 rounded-full relative transition-all duration-300 shadow-inner", notificationsEnabled ? "bg-primary" : "bg-slate-200")}
                            >
                                <div className={clsx("absolute top-1 left-1 bg-white size-3 rounded-full shadow-md transition-transform duration-300", notificationsEnabled ? "translate-x-5" : "")}></div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="animate-fade-in delay-100">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Security</h2>
                    <div className="neo-card p-4 space-y-4">
                        <p className="text-xs text-slate-500">Security managed via Google Auth / Firebase.</p>
                    </div>
                </section>

                {/* Data & Storage */}
                <section className="animate-fade-in delay-150">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Data Retention</h2>
                    <div className="neo-card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="neo-inset size-9 rounded-xl flex items-center justify-center text-slate-600 bg-slate-50">
                                    <span className="material-symbols-outlined text-lg">sd_storage</span>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Local Storage</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Status: Operational</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleResetData}
                            className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">cleaning_services</span>
                            Clear Local Cache
                        </button>
                    </div>
                </section>

                {/* Account Actions */}
                <section className="animate-fade-in delay-300 pt-2 pb-8">
                    <button onClick={handleSignOut} className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-[0.2em] neo-btn rounded-xl hover:text-red-500 active:scale-95 transition-all">
                        Terminate Session
                    </button>
                    <div className="text-center mt-6">
                        <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest opacity-60">PCK2PCK v1.2.0 • Build 2405</p>
                    </div>
                </section>

            </main>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="neo-card w-full max-w-sm p-6 transform transition-all animate-scale-up">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Invite Member</h2>
                                <p className="text-xs text-slate-500">Expand your household collective.</p>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} className="neo-btn rounded-full p-2 text-gray-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Steph Currie"
                                    value={inviteData.name}
                                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                    className="neo-inset w-full p-3.5 rounded-xl text-sm font-black text-slate-900 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email or Phone</label>
                                <input
                                    type="text"
                                    placeholder="steph@example.com or 555-0000"
                                    value={inviteData.contact}
                                    onChange={(e) => setInviteData({ ...inviteData, contact: e.target.value })}
                                    className="neo-inset w-full p-3.5 rounded-xl text-sm font-black text-slate-900 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleSendInvite}
                                disabled={!inviteData.contact || isInviting}
                                className={clsx(
                                    "w-full p-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2",
                                    inviteData.contact && !isInviting
                                        ? "neo-btn-primary text-white active:scale-95"
                                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                {isInviting ? (
                                    <div className="size-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-base">send</span>
                                )}
                                <span>Dispatch Invite</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}