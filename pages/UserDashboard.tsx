
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
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white/5 p-6 md:p-8 rounded-3xl border border-white/5 shadow-sm">
        <div className="relative group">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border border-white/10 bg-black/50 flex items-center justify-center">
            {profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-12 h-12 text-gray-500" />}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-xl text-black cursor-pointer shadow-lg hover:scale-105 transition-transform">
            <Camera className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange} />
          </label>
        </div>
        <div className="text-center md:text-left flex-1 space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {user.username}</h1>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              user.subscription === SubscriptionType.VVIP ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30' :
              user.subscription === SubscriptionType.VIP ? 'bg-primary/20 text-primary border border-primary/30' :
              'bg-gray-800 text-gray-300'
            }`}>
              {user.subscription} {isSubscribed && !isExpired ? 'ACTIVE' : 'FREE'}
            </span>
            {isSubscribed && !isExpired && (
              <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase bg-white/5 text-gray-400 border border-white/10">
                {daysRemaining} Days Remaining
              </span>
            )}
            {!isSubscribed && isWithinGracePeriod && (
              <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                Grace Period: {graceDaysLeft} Days Left
              </span>
            )}
          </div>
        </div>
        <Link to="/payment" className="w-full md:w-auto btn-primary">
          {isSubscribed ? 'Extend Subscription' : 'Upgrade to PRO'}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="glass p-6 md:p-8 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white"><MessageCircle className="w-5 h-5 text-primary" /> Support Desk</h3>
          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help you today?" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary/50 h-24 text-white resize-none" />
            <button type="submit" disabled={isSending || !message.trim()} className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center transition-all ${sendSuccess ? 'bg-primary text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {sendSuccess ? 'Sent Successfully' : 'Send Message'}
            </button>
          </form>

          {/* User Messages/Tickets */}
          <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {userMessages.map(msg => (
              <div key={msg.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                <div className="text-[10px] font-semibold tracking-wider text-gray-400 flex justify-between uppercase">
                  <span>Ticket #{msg.id.slice(0, 5)}</span>
                  <span>{new Date(msg.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-300">"{msg.content}"</p>
                {msg.adminReply && (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 mt-2">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase mb-1 tracking-wider">
                      <Reply className="w-3 h-3" /> Support Response
                    </div>
                    <p className="text-sm text-white">{msg.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Trophy className="w-5 h-5 text-primary" /> Quick Actions</h3>
            <button 
              onClick={() => document.getElementById('live-board')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl group hover:bg-primary/20 transition-all text-left"
            >
              <div className="font-semibold text-primary text-sm">View Today's Predictions</div>
              <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="glass p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Star className="w-5 h-5 text-[#FFD700]" /> Leave a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex gap-2 justify-center mb-2">
                {[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => setRating(s)}><Star className={`w-5 h-5 ${s <= rating ? 'text-[#FFD700] fill-current' : 'text-gray-600'} hover:scale-110 transition-transform`} /></button>)}
              </div>
              <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Share your experience with us..." className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm h-20 text-white resize-none outline-none focus:border-[#FFD700]/50" />
              <button type="submit" disabled={isSendingReview || !review.trim()} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-colors">
                {reviewSuccess ? 'Review Submitted!' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div id="live-board" ref={boardRef} className="glass p-6 md:p-10 rounded-3xl bg-black/20 border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-10">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">Live <span className="text-primary">Predictions</span></h3>
            <p className="text-xs font-medium text-gray-500">Your curated tips and match insights</p>
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
                    <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
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
                          <div key={cat} className="space-y-4">
                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                              cat === PredictionCategory.SUREST ? 'bg-[#D5D04A]/10 text-[#D5D04A] border-[#D5D04A]/20' :
                              cat === PredictionCategory.VVIP ? 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20' :
                              cat === PredictionCategory.VIP ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-white/5 text-gray-300 border-white/10'
                            }`}>
                              <div className="text-[10px] font-bold uppercase tracking-wider">
                                {cat === PredictionCategory.SUREST ? 'Surest Bet' : `${cat} Tips`}
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-wider">
                                Total Odds: {totalOdds}
                              </div>
                            </div>

                            <div className="grid gap-3">
                              {tips.map((p) => (
                                <div key={p.id} className="relative group overflow-hidden rounded-xl border border-white/5 bg-black/20 transition-all hover:bg-black/30">
                                  <div className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${!hasAccess ? 'blur-[4px] select-none pointer-events-none' : ''}`}>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {p.kickoffTime}</span>
                                        <span className="text-[10px] font-bold uppercase text-primary border border-primary/20 px-2 py-0.5 rounded">{p.league}</span>
                                      </div>
                                      <h4 className="text-sm md:text-base font-bold text-white group-hover:text-primary transition-colors">{p.match}</h4>
                                    </div>
                                    <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                      <div className="text-right">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Pick</div>
                                        <div className="text-sm font-bold text-primary">{p.tip}</div>
                                      </div>
                                      <div className="bg-white/5 px-4 py-2 rounded-lg text-center min-w-[70px]">
                                        <div className="text-[10px] text-gray-500 uppercase mb-0.5">Odds</div>
                                        <div className="text-sm font-bold text-white">{p.odds}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {!hasAccess && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 p-4 text-center border border-white/10 rounded-xl">
                                      <Lock className="w-5 h-5 text-gray-400 mb-2" />
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mb-3">Locked for {cat} members</p>
                                      <Link to="/payment" className="btn-primary py-1.5 px-4 text-[10px]">
                                        Upgrade
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
