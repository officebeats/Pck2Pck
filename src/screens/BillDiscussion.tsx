import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface Comment {
  id: number;
  user: string;
  avatar: string;
  time: string;
  text: string;
  isMe: boolean;
}

export default function BillDiscussion() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: 'Maria',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARR3j86vIaB3YSrtlriKAt-IztzIzMIaA1qX_jVgFlSCABTwuffx13PdgOD4rMOEjbT3h1s_Pcjdb6VXr6K6G8ILB6ZDrVhz4sH9HE0vy3S5XXe7q_Baa3Y8sUzFju2miF3hVHGIg4m8yL-7tsP7aaeEnXlTRVXFRfRDPWn6lOpaaLm9H0VARWOWAO12Z8K6qLLLalG_wWTEkTNoFerYUmJcqt3o_lNkcVwkk9F3ODxNSRzPHPszBTqoGMcACnfV9LyThw2YZ8-pI',
      time: '2h ago',
      text: 'Hey @Alex, just a reminder this is coming up. Is it all set?',
      isMe: false
    },
    {
      id: 2,
      user: 'Alex',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ5mvAXXuPpwvDXZ7YyGz-Jauv_IExhQuvAt9loVRULPKoS5Tyi1x609wenazIuVi_w6yH0wCv2jx7u49kCwQx3HTMiP76xLDMeLeZH3u0_IOHcNPHtblXxEPo_rlQMQjnMEYTT6ZvFnADSPY0sQRzpJuJxdc4SehdqW4s-1Kv3hraUeEMApGlc5WF58khYBbQrryLsqMXeTAYs_Xmdo7sD5SWgGSuLmc5NYDkguoGj-UCvT6VmBfDcMSAFGZd_vfxeHkybwZdL4c',
      time: '1h ago',
      text: "Yep, all good! It's on autopay.",
      isMe: true
    }
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newComment: Comment = {
      id: Date.now(),
      user: 'You',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOCFvlZ58tpgrXMjatJU1I3OFUmh1LBzYPUNEkzz6QXpSs9KgfDKtlLq06vvrXF9-BRWw6jN2NhGaYaiOUNF9dbTpGwzY1eCJTOImkyZYvOQO0SB-uQPYlh5eYpJqEg5KlfnssoAt3UY_51wmWHQD9SpCVNfA1RvNs2a4i09amFKRP1JVOZPxdErC9ZINDQZRUCNTlgAIPvxA9dR-9rQzOP3jjb9UoWbCKY1duK3K31N0SrRMuRIeFEOifeiByBiKjnWnWBawJe9M',
      time: 'Just now',
      text: inputValue,
      isMe: true
    };

    setComments([...comments, newComment]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light font-sans transition-colors duration-200">
      {/* Top App Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 Backdrop-blur-md p-4 pb-2 border-b border-white/40 transition-colors">
        <button onClick={() => navigate(-1)} className="neo-btn flex size-9 shrink-0 items-center justify-center text-slate-800 rounded-full shadow-sm active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-black leading-tight tracking-tight text-slate-900 flex-1 text-center">Protocol Feed</h1>
        <div className="size-9 shrink-0"></div>
      </header>

      <main className="flex-1 flex flex-col pb-24">
        {/* Bill Details Card */}
        <div className="neo-card p-5 m-5 transition-all duration-300 hover:shadow-lg active:scale-[0.99] border border-white/40">
          <div className="flex items-center gap-5">
            <div className="neo-inset p-0.5 rounded-full shrink-0">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14 neo-card" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDLYcx7sAE1t4itx78F6EJ5jos1tfbA15V3ejf1MuHVMwBWPmwuZxJPE5q3pNjuXqmWSD3Ds6Gt9vdMXCTdRlqDhrlesWc-L0PeDQoz79Iri3OKJ13ctUJtsXiaJw_D8ferydtr9gpPsLkipeKHN4OLAAcux4L6hXNTHLevs3w7UPussj3EMcaCpZY68y7fPA6EA3kcm71F2NsKx8ydBrzuuG_XUYmnRQA1WPNgerFexKw4ZZ7O8dlZ-RwxKEi-qk0ZoRQ6rfaxo8s")' }}></div>
            </div>
            <div className="flex flex-col justify-center flex-1">
              <p className="text-slate-900 text-base font-black tracking-tight leading-none">Netflix Subscription</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">$15.99 Liability • 5 Days Remaining</p>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="neo-card p-0.5 rounded-full shadow-sm">
                <img className="h-8 w-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDizDSHzGtzbSgpzgmJ6eyQGVVIE55Olo0FsJ9C2CD7xGNBY8yegFp9Fs63SJJilLvErPeyDHJq4gboqoHSuLPZ5LwmdJ8eZGswIIYGyEbp3Np-pFKfx2fL5RfqNLLa0uI4rqllMrRc-IqXeIjctC-4rrFwoxEC01tlNSCrn1YYjvF3pvPSDA0iNFEE2IVFKbdBkaFAWsQXEet5bewAma5pAMF7jhKI3BTUFTgebbJF6TfyN1gi8_xos9u-JpHFWw8TSGpw8xxLBO0" alt="Owner" />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alex</p>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="flex-1 px-5 space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className={`flex w-full flex-row items-start justify-start gap-4 animate-fade-in ${comment.isMe ? 'pl-10 flex-row-reverse' : 'pr-10'}`}>
              <div className="neo-inset p-0.5 rounded-full shrink-0">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-9 neo-card shadow-sm border border-white/50"
                  style={{ backgroundImage: `url("${comment.avatar}")` }}
                ></div>
              </div>
              <div className={clsx("flex flex-1 flex-col gap-1.5", comment.isMe ? "items-end" : "items-start")}>
                <div className={clsx("flex flex-row items-center gap-x-2 px-1", comment.isMe ? "flex-row-reverse" : "")}>
                  <p className="text-slate-900 text-[10px] font-black uppercase tracking-widest">{comment.user}</p>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{comment.time}</p>
                </div>
                <div className={clsx(
                  "px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed transition-all duration-300",
                  comment.isMe
                    ? "bg-primary text-white rounded-br-none shadow-xl shadow-primary/20"
                    : "bg-white text-slate-800 rounded-bl-none neo-card"
                )}>
                  <p className="tracking-tight" dangerouslySetInnerHTML={{
                    __html: comment.text.replace(/@(\w+)/g, '<span class="text-primary font-black drop-shadow-sm">@$1</span>')
                  }}></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Composer / Comment Input Bar */}
      <footer className="fixed bottom-0 max-w-[480px] self-center w-full bg-background-light/95 Backdrop-blur-md p-4 pb-6 border-t border-white/40 transition-colors z-30">
        <div className="flex items-center gap-4">
          <div className="neo-inset p-0.5 rounded-full shrink-0">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 neo-card shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBOCFvlZ58tpgrXMjatJU1I3OFUmh1LBzYPUNEkzz6QXpSs9KgfDKtlLq06vvrXF9-BRWw6jY2NhGaYaiOUNF9dbTpGwzY1eCJTOImkyZYvOQO0SB-uQPYlh5eYpJqEg5KlfnssoAt3UY_51wmWHQD9SpCVNfA1RvNs2a4i09amFKRP1JVOZPxdErC9ZINDQZRUCNTlgAIPvxA9dR-9rQzOP3jjb9UoWbCKY1duK3K31N0SrRMuRIeFEOifeiByBiKjnWnWBawJe9M")' }}></div>
          </div>
          <div className="flex-1 neo-inset p-1 rounded-full bg-white">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-5 text-sm font-black text-slate-900 focus:outline-none bg-transparent placeholder:text-slate-200"
              placeholder="Synchronize transmission..."
            />
          </div>
          <button
            onClick={handleSend}
            className="neo-btn-primary flex items-center justify-center rounded-2xl size-14 shrink-0 shadow-2xl disabled:opacity-20 transition-all active:scale-90 text-white"
            disabled={!inputValue.trim()}
          >
            <span className="material-symbols-outlined text-2xl font-black">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
}