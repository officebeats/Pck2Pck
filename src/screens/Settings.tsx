import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useGroup, GroupMember } from '@/hooks/useGroup';
import { useToast } from '@/components/Toast';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function Settings() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showError, showSuccess } = useToast();
    const {
        group,
        membersList: members,
        isAdmin,
        canManageGroup,
        removeMember,
        createGroup,
        joinGroup,
        generateInviteCode
    } = useGroup();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local state for edits
    const [name, setName] = useState('User');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');

    // Group UI State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [generatedInviteCode, setGeneratedInviteCode] = useState('');

    // Loading states
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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
                'pchk_chats', 'pchk_bill_payments',
                'pchk_bills', 'pchk_income_sources'
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

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setIsProcessing(true);
        try {
            await createGroup(newGroupName);
            showSuccess('Group Created', `"${newGroupName}" established.`);
            setNewGroupName('');
        } catch (error) {
            showError('Error', 'Failed to create group');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!inviteCodeInput.trim()) return;
        setIsProcessing(true);
        try {
            await joinGroup(inviteCodeInput.toUpperCase());
            showSuccess('Joined Group', 'Welcome to the team.');
            setInviteCodeInput('');
        } catch (error) {
            showError('Invalid Code', 'Could not find group with that code.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateInvite = async () => {
        try {
            const code = await generateInviteCode();
            setGeneratedInviteCode(code);
            // Native Share
            if (navigator.share) {
                navigator.share({
                    title: 'Join my Pck2Pck Group',
                    text: `Join my finance group on Pck2Pck with code: ${code}`,
                    url: window.location.origin
                }).catch(console.error);
            }
        } catch (error) {
            showError('Error', 'Could not generate invite code');
        }
    };

    const handleRemoveMember = async (member: GroupMember) => {
        if (window.confirm(`Remove ${member.name}? They will lose access to this group.`)) {
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
                <h1 className="text-slate-900 text-lg font-black leading-tight tracking-tight flex-1 text-center md:text-left">Settings</h1>
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
                            </div>
                        </div>
                    </div>
                </section>

                {/* Group Management Section */}
                <section className="animate-fade-in delay-100">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Settings</h2>
                    </div>

                    {!group ? (
                        <div className="neo-card p-6 space-y-6">
                            {/* Create Group */}
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">Create New Group</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Group Name"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="neo-inset flex-1 p-3 rounded-xl text-sm font-bold focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCreateGroup}
                                        disabled={!newGroupName.trim() || isProcessing}
                                        className="neo-btn-primary px-4 rounded-xl font-black text-xs uppercase tracking-wider"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 w-full"></div>

                            {/* Join Group */}
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">Join Existing Group</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter Invite Code"
                                        value={inviteCodeInput}
                                        onChange={(e) => setInviteCodeInput(e.target.value)}
                                        className="neo-inset flex-1 p-3 rounded-xl text-sm font-bold focus:outline-none uppercase tracking-widest"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={handleJoinGroup}
                                        disabled={!inviteCodeInput.trim() || isProcessing}
                                        className="neo-btn px-4 rounded-xl font-black text-xs uppercase tracking-wider text-primary"
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="neo-card divide-y divide-slate-100">
                            {/* Group Info Header */}
                            <div className="p-4 bg-slate-50/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Group</p>
                                        <h3 className="text-lg font-black text-slate-900">{group.name}</h3>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={handleGenerateInvite}
                                            className="neo-btn px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary"
                                        >
                                            <span className="material-symbols-outlined text-base">person_add</span>
                                            Invite
                                        </button>
                                    )}
                                </div>
                                {generatedInviteCode && (
                                    <div className="mt-3 p-3 bg-primary/10 rounded-xl flex items-center justify-between border border-primary/20">
                                        <span className="text-xs font-bold text-primary">Code: <span className="font-black text-lg ml-2 tracking-[0.2em]">{generatedInviteCode}</span></span>
                                        <span className="text-[9px] font-bold text-primary/60 uppercase">Share this code</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 p-4">
                                {members.map(member => (
                                    <div key={member.id} className="neo-card p-2 flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase overflow-hidden">
                                            {member.photoURL ? (
                                                <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                member.name.substring(0, 2)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-black text-slate-900 truncate">{member.name}</p>
                                                {member.id === group?.members[user?.uid || '']?.id && (
                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded tracking-wider">You</span>
                                                )}
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                        </div>
                                        {canManageGroup && member.id !== user?.uid && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Account Actions */}
                <section className="animate-fade-in delay-300 pt-2 pb-8">
                    <div className="neo-card p-4 space-y-4 mb-6">
                        <button
                            onClick={handleResetData}
                            className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">cleaning_services</span>
                            Clear Local Cache
                        </button>
                    </div>

                    <button onClick={handleSignOut} className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-[0.2em] neo-btn rounded-xl hover:text-red-500 active:scale-95 transition-all">
                        Terminate Session
                    </button>
                    <div className="text-center mt-6">
                        <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest opacity-60">PCK2PCK v1.2.0 • Build Multi-01</p>
                    </div>
                </section>

            </main>
        </div>
    );
}