
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, SubscriptionType, SupportMessage, Prediction, PredictionCategory, PredictionResult } from '../types';
import { supabase } from '../lib/supabase';
import { Camera, User as UserIcon, MessageCircle, Lock, ChevronRight, Shield, Star, ThumbsUp, Clock, Target, Calendar, Loader2, ChevronDown, ChevronUp, Reply, CheckCircle2, Download, Trophy } from 'lucide-react';
import { useToast } from '../components/Toast';
import { toPng } from 'html-to-image';

import { useAuth } from '../lib/AuthContext';

interface UserDashboardProps {
  config: any;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ config }) => {
  const { user } = useAuth();
  if (!user) return null;

  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [isSending, setIsSending] = useState(false);
  const [isSendingReview, setIsSendingReview] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [profilePic, setProfilePic] = useState(user.profile_pic || '');
  const [userMessages, setUserMessages] = useState<SupportMessage[]>([]);
  const [upcomingTips, setUpcomingTips] = useState<Prediction[]>([]);
  const [loadingTips, setLoadingTips] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  const [isDownloading, setIsDownloading] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const isSubscribed = user.subscription !== SubscriptionType.FREE;
  const daysRemaining = user.expiry_date ? Math.ceil((new Date(user.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
  const isExpired = daysRemaining < 0;

  // Grace period logic (5 days)
  const gracePeriodDays = 5;
  const registrationDate = user.created_at ? new Date(user.created_at) : new Date();
  const gracePeriodExpiry = new Date(registrationDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
  const isWithinGracePeriod = new Date() < gracePeriodExpiry;
  const graceDaysLeft = Math.ceil((gracePeriodExpiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  useEffect(() => {
    fetchMessages();
    fetchUpcomingPredictions();
  }, [user.id, user.subscription, sendSuccess]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('id, content, adminReply, date, replyDate')
      .eq('userId', user.id)
      .order('date', { ascending: false });
    
    if (!error && data) {
      setUserMessages(data as SupportMessage[]);
    }
  };

  const fetchUpcomingPredictions = async () => {
    setLoadingTips(true);
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('id, league, match, tip, odds, kickoffTime, category, result, date')
        .eq('result', PredictionResult.PENDING)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        setUpcomingTips(data as Prediction[]);
        
        const today = new Date().toISOString().split('T')[0];
        setExpandedDates({ [today]: true });
      }
    } catch (err: any) {
      console.error("Error fetching predictions:", err.message);
    } finally {
      setLoadingTips(false);
    }
  };

  const groupedTips = useMemo(() => {
    return upcomingTips.reduce((acc, p) => {
      const date = p.date;
      if (!acc[date]) acc[date] = { [PredictionCategory.FREE]: [], [PredictionCategory.VIP]: [], [PredictionCategory.VVIP]: [], [PredictionCategory.SUREST]: [] };
      acc[date][p.category].push(p);
      return acc;
    }, {} as Record<string, Record<PredictionCategory, Prediction[]>>);
  }, [upcomingTips]);

  const sortedDates = Object.keys(groupedTips).sort();

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        showToast("Image too large! Max 1MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfilePic(base64String);
        await supabase.from('profiles').update({ profile_pic: base64String }).eq('id', user.id);
        showToast("Profile picture updated!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);
    const { error } = await supabase.from('support_messages').insert([{
      userId: user.id,
      username: user.username,
      content: message,
      date: new Date().toISOString()
    }]);
    if (!error) {
      showToast("Message sent to support!", "success");
      setMessage('');
      setSendSuccess(true);
      fetchMessages();
      setTimeout(() => setSendSuccess(false), 3000);
    }
    setIsSending(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review.trim()) return;
    setIsSendingReview(true);
    const { error } = await supabase.from('testimonials').insert([{
      user_id: user.id,
      username: user.username,
      profile_pic: profilePic,
      content: review,
      rating: rating,
      is_approved: false
    }]);
    if (!error) {
      showToast("Review submitted!", "success");
      setReview('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    }
    setIsSendingReview(false);
  };

  const handleDownloadBoard = async () => {
    if (!boardRef.current) return;
    setIsDownloading(true);
    showToast("Preparing your high-res board...", "info");
    
    try {
      // Ensure images are loaded and fonts are ready
      await document.fonts.ready;
      
      const dataUrl = await toPng(boardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
        skipFonts: true,
        fontEmbedCSS: '',
        style: {
          borderRadius: '0'
        }
      });
      
      const link = document.createElement('a');
      link.download = `BettaBets-Board-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Board saved successfully!", "success");
    } catch (err) {
      console.error("Download failed:", err);
      showToast("Failed to save board. Try again.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#00C853]/20 bg-black flex items-center justify-center">
            {profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-16 h-16 text-gray-700" />}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-[#00C853] p-2 rounded-xl text-black cursor-pointer shadow-lg">
            <Camera className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange} />
          </label>
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-black italic mb-1 uppercase tracking-tight">Master {user.username}</h1>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              user.subscription === SubscriptionType.VVIP ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' :
              user.subscription === SubscriptionType.VIP ? 'bg-[#00C853] text-black shadow-[0_0_15px_rgba(0,200,83,0.3)]' :
              'bg-gray-700 text-gray-300'
            }`}>
              {user.subscription} {isSubscribed && !isExpired ? 'ACTIVE' : 'FREE'}
            </span>
            {isSubscribed && !isExpired && (
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-white/5 text-gray-400 border border-white/5">
                {daysRemaining} Days Remaining
              </span>
            )}
            {!isSubscribed && isWithinGracePeriod && (
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/20">
                Grace Period: {graceDaysLeft} Days Left
              </span>
            )}
          </div>
        </div>
        <Link to="/payment" className="w-full md:w-auto bg-[#00C853] text-black px-8 py-4 rounded-2xl font-black text-sm uppercase italic hover:scale-105 transition-transform text-center shadow-lg shadow-[#00C853]/20">
          {isSubscribed ? 'Extend VIP' : 'Unlock Expert Tips'}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="glass p-8 rounded-[2rem] space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-[#00C853] italic uppercase"><MessageCircle className="w-5 h-5" /> Support</h3>
          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Problem with subscription? Message us..." className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-[#00C853]/50 h-24 text-white" />
            <button type="submit" disabled={isSending || !message.trim()} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${sendSuccess ? 'bg-[#00C853] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {sendSuccess ? 'Dispatched' : 'Contact Analyst'}
            </button>
          </form>

          {/* User Messages/Tickets */}
          <div className="mt-8 space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {userMessages.map(msg => (
              <div key={msg.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                <div className="text-[10px] font-bold text-gray-500 flex justify-between">
                  <span>Ticket #{msg.id.slice(0, 5)}</span>
                  <span>{new Date(msg.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-white/80 italic">"{msg.content}"</p>
                {msg.adminReply && (
                  <div className="bg-[#00C853]/10 p-3 rounded-xl border border-[#00C853]/20 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 text-[#00C853] text-[9px] font-black uppercase mb-1">
                      <Reply className="w-3 h-3" /> Official Response
                    </div>
                    <p className="text-xs font-bold text-[#00C853]">{msg.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass p-8 rounded-[2rem] space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-[#00C853] italic uppercase"><Trophy className="w-5 h-5" /> Quick Link</h3>
            <button 
              onClick={() => document.getElementById('live-board')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full flex items-center justify-between p-6 bg-[#00C853]/10 border border-[#00C853]/30 rounded-2xl group hover:bg-[#00C853]/20 transition-all"
            >
              <div className="font-black italic uppercase">See today's predictions</div>
              <ChevronRight className="w-5 h-5 text-[#00C853] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="glass p-8 rounded-[2rem] space-y-4 border-[#00C853]/10">
            <h3 className="text-xl font-bold flex items-center gap-2 text-[#FFD700] italic uppercase"><Star className="w-5 h-5" /> Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div className="flex gap-2 justify-center mb-1">
                {[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => setRating(s)}><Star className={`w-4 h-4 ${s <= rating ? 'text-[#FFD700] fill-current' : 'text-gray-600'}`} /></button>)}
              </div>
              <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Write your success story..." className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs h-16 text-white" />
              <button type="submit" disabled={isSendingReview || !review.trim()} className="w-full py-2.5 bg-[#00C853]/10 text-[#00C853] rounded-xl font-black text-[9px] uppercase tracking-widest">
                {reviewSuccess ? 'Sent for moderation!' : 'Post Success'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div id="live-board" ref={boardRef} className="glass p-10 rounded-[3.5rem] bg-[#0a0a0a] border-white/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Live <span className="text-[#00C853]">Board</span></h3>
            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em] mt-1">Classified Market Access</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadBoard}
              disabled={isDownloading}
              className="bg-white/5 p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-[#00C853]"
              title="Download Board as PNG"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10"><Calendar className="w-5 h-5 text-[#00C853]" /></div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {loadingTips ? (
            <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00C853]/40" /></div>
          ) : sortedDates.length > 0 ? (
            sortedDates.map((dateString) => {
              const isOpen = expandedDates[dateString];
              const categories = groupedTips[dateString];
              const isToday = dateString === new Date().toISOString().split('T')[0];

              return (
                <div key={dateString} className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/5">
                  <button 
                    onClick={() => toggleDate(dateString)}
                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-[#00C853] animate-pulse' : 'bg-blue-500'}`}></div>
                      <span className="font-black italic uppercase text-xs tracking-widest text-white">
                        {isToday ? 'Today' : new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
                      {/* Classified Sections */}
                      {[PredictionCategory.SUREST, PredictionCategory.FREE, PredictionCategory.VIP, PredictionCategory.VVIP].map((cat) => {
                        const tips = categories[cat];
                        if (tips.length === 0) return null;

                        const hasAccess = 
                          cat === PredictionCategory.FREE || 
                          isWithinGracePeriod ||
                          (cat === PredictionCategory.SUREST && (user.subscription === SubscriptionType.VIP || user.subscription === SubscriptionType.VVIP)) ||
                          (cat === PredictionCategory.VIP && (user.subscription === SubscriptionType.VIP || user.subscription === SubscriptionType.VVIP)) ||
                          (cat === PredictionCategory.VVIP && user.subscription === SubscriptionType.VVIP);

                        const totalOdds = tips.reduce((sum, p) => sum * Number(p.odds), 1).toFixed(2);

                        return (
                          <div key={cat} className="space-y-6">
                            <div className={`flex items-center justify-between px-6 py-4 rounded-2xl ${
                              cat === PredictionCategory.SUREST ? 'bg-[#D5D04A] text-black' :
                              cat === PredictionCategory.VVIP ? 'bg-[#FFD700] text-black' :
                              cat === PredictionCategory.VIP ? 'bg-[#0099FF] text-white' :
                              'bg-gray-800 text-gray-300'
                            }`}>
                              <div className="text-[11px] font-black uppercase tracking-[0.2em]">
                                {cat === PredictionCategory.SUREST ? 'SUREST WIN OF THE DAY' : `${cat} MARKET`}
                              </div>
                              <div className="text-[11px] font-black uppercase tracking-widest">
                                TOTAL ODDS: {totalOdds}
                              </div>
                            </div>

                            <div className="grid gap-4">
                              {tips.map((p) => (
                                <div key={p.id} className="relative group overflow-hidden rounded-3xl border border-white/5 bg-[#0c0c0c] transition-all">
                                  <div className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 ${!hasAccess ? 'blur-md select-none pointer-events-none' : ''}`}>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-1.5">
                                        <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.kickoffTime}</span>
                                        <span className="text-[9px] font-black uppercase text-[#00C853] tracking-widest">{p.league}</span>
                                      </div>
                                      <h4 className="text-xl font-black italic uppercase tracking-tight text-white group-hover:text-[#00C853] transition-colors">{p.match}</h4>
                                      <div className="text-[11px] font-bold text-gray-500 mt-1">Pick: <span className="text-white">{p.tip}</span> @ {p.odds}</div>
                                    </div>
                                    <div className="flex items-center gap-5 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                      <div className="bg-[#151515] px-6 py-3 rounded-2xl text-center border border-white/5 min-w-[120px]">
                                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Expert Tip</div>
                                        <div className="text-sm font-black uppercase text-[#00C853]">{p.tip}</div>
                                      </div>
                                      <div className="bg-[#151515] px-6 py-3 rounded-2xl text-center min-w-[80px] border border-white/5">
                                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Odds</div>
                                        <div className="text-lg font-black text-white">{p.odds}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {!hasAccess && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 p-4 text-center">
                                      <Lock className="w-6 h-6 text-[#00C853] mb-2" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-white mb-3">Upgrade to unlock {cat} tips</p>
                                      <Link to="/payment" className="bg-[#00C853] text-black px-4 py-1.5 rounded-lg text-[9px] font-black uppercase italic hover:scale-105 transition-transform">
                                        Upgrade Now
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] space-y-4">
              <Target className="w-10 h-10 mx-auto text-gray-700 opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Syncing next expert cycle...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
