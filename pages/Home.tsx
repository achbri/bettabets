
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Clock, 
  X, 
  Megaphone, 
  Target, 
  ShieldCheck, 
  Quote, 
  User as UserIcon, 
  Play, 
  TrendingUp, 
  CheckCircle, 
  Loader2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  Sparkles,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { User, Prediction, PredictionCategory, PredictionResult, AppConfig, Testimonial, Coupon } from '../types';
import { useAuth } from '../lib/AuthContext';
import { DEFAULT_APP_CONFIG } from '../constants';
import { supabase } from '../lib/supabase';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [surestPrediction, setSurestPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!window.navigator.onLine) {
        setIsDataLoaded(true);
        return;
      }
      try {
        const [configRes, couponRes, tickerRes, predRes, testimonialRes, surestRes] = await Promise.all([
          supabase.from('app_config').select('*').eq('id', 1).maybeSingle(),
          supabase.from('coupons').select('*').eq('isActive', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('ticker_messages').select('content').eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('predictions').select('id, league, match, tip, odds, kickoffTime, category, result, date')
            .eq('category', PredictionCategory.FREE)
            .eq('result', PredictionResult.PENDING)
            .order('date', { ascending: true }),
          supabase.from('testimonials').select('id, username, content, profile_pic, rating').eq('is_approved', true).order('created_at', { ascending: false }).limit(3),
          supabase.from('predictions').select('id, league, match, tip, odds, kickoffTime, category, result, date')
            .eq('category', PredictionCategory.SUREST)
            .eq('result', PredictionResult.PENDING)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        if (configRes.data) setConfig(configRes.data as AppConfig);
        if (couponRes.data) setActiveCoupon(couponRes.data as Coupon);
        
        if ((configRes.data?.popup?.active || !!couponRes.data) && !sessionStorage.getItem('popup_seen')) {
          setTimeout(() => setShowPopup(true), 1500);
        }

        setTickerMessages(tickerRes.data?.length ? tickerRes.data.map(m => m.content) : [
          "Secure relay active",
          "Market analysis protocol engaged",
          "Verified predictions synchronized"
        ]);

        if (predRes.data) {
          setPredictions(predRes.data as Prediction[]);
          const today = new Date().toISOString().split('T')[0];
          setExpandedDates(prev => ({ ...prev, [today]: true }));
        }

        if (surestRes?.data) setSurestPrediction(surestRes.data as Prediction);

        if (testimonialRes.data) setTestimonials(testimonialRes.data as Testimonial[]);

      } catch (err) {
        console.warn("Sync issue", err);
      } finally {
        setIsDataLoaded(true);
      }
    };

    fetchData();
    const handleVisibility = () => document.visibilityState === 'visible' && fetchData();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const closePopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('popup_seen', 'true');
  };

  const sortedDates = useMemo(() => {
    const groups = predictions.reduce((acc, p) => {
      if (!acc[p.date]) acc[p.date] = [];
      acc[p.date].push(p);
      return acc;
    }, {} as Record<string, Prediction[]>);
    return Object.keys(groups).sort().map(date => ({ date, tips: groups[date] }));
  }, [predictions]);

  return (
    <div className="bg-dark-bg text-white overflow-hidden">
      {/* Ticker Section */}
      <div className="bg-[#D5D04A] border-y border-white/5 py-3 overflow-hidden relative z-10 backdrop-blur-md">
        <div 
          className="flex whitespace-nowrap" 
          style={{ 
            animation: `scroll ${config.ticker_speed || 40}s linear infinite`,
            width: 'fit-content'
          }}
        >
          {[...tickerMessages, ...tickerMessages, ...tickerMessages, ...tickerMessages].map((msg, i) => (
            <div key={i} className="inline-flex items-center mx-16">
              <Activity className="w-3 h-3 mr-3 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">{msg}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>

      {/* Home Sections with minimal spacing */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-4">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/10 blur-[200px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 bg-white/5 px-8 py-3 rounded-2xl mb-8 border border-white/10"
          >
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="technical-label opacity-80">Soccer Prediction System</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[12vw] md:text-[14vw] font-black uppercase italic leading-[0.8] tracking-tighter mb-4"
          >
            WIN THE<br />
            <span className="text-primary text-glow">GAME</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-4 font-medium tracking-tight uppercase"
          >
            Precision soccer analysis for consistent winning. Accurate tips, history and expert insights.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <Link to={user ? "/dashboard" : "/register"} className="btn-primary w-full sm:w-auto">Get Started Now</Link>
            <button 
              onClick={() => document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' })} 
              className="w-full sm:w-auto px-12 py-6 bg-white/5 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-white/10 transition-all border border-white/10"
            >
              Analyze Market
            </button>
          </motion.div>
        </div>
      </section>

      {/* Free Slips Section and Surest Win */}
      <section id="market" className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Surest Win of the Day */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-[#D5D04A]">
              SUREST WIN <span className="text-white">OF THE DAY</span>
            </h2>
            <div className="hidden md:flex items-center gap-2 bg-[#D5D04A]/10 px-4 py-2 rounded-full border border-[#D5D04A]/20">
              <Sparkles className="w-4 h-4 text-[#D5D04A]" />
              <span className="text-[10px] font-black tracking-widest uppercase text-[#D5D04A]">95% Confidence</span>
            </div>
          </div>
          
          <div className="glass p-8 md:p-12 border-[#D5D04A]/20 bg-[#D5D04A]/5 relative overflow-hidden rounded-[2.5rem]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D5D04A]/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            {!surestPrediction ? (
               <div className="text-center py-10">
                 <ShieldCheck className="w-12 h-12 text-[#D5D04A]/30 mx-auto mb-4" />
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Validating today's best signal...</p>
               </div>
            ) : user?.subscription === 'VIP' || user?.subscription === 'VVIP' ? (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="technical-label px-4 py-1.5 bg-[#D5D04A]/10 text-[#D5D04A] rounded-lg border border-[#D5D04A]/20 italic">
                      {surestPrediction.league}
                    </span>
                    <span className="technical-label flex items-center gap-2 italic text-gray-300">
                      <Clock className="w-3 h-3" /> {surestPrediction.kickoffTime}
                    </span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white">{surestPrediction.match}</h3>
                </div>
                
                <div className="flex items-center gap-8 justify-between lg:justify-end">
                  <div className="text-right">
                    <div className="technical-label mb-2 italic text-gray-400">Verified Signal</div>
                    <div className="text-3xl font-black uppercase text-[#D5D04A] drop-shadow-[0_0_10px_rgba(213,208,74,0.4)]">
                      {surestPrediction.tip}
                    </div>
                  </div>
                  <div className="bg-[#D5D04A] px-10 py-5 rounded-3xl text-center min-w-[140px] shadow-[0_10px_30px_rgba(213,208,74,0.3)]">
                    <div className="text-[10px] font-black text-black uppercase mb-1 italic opacity-60">Magnitude</div>
                    <div className="text-4xl font-black text-black">{surestPrediction.odds}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 relative z-10">
                <ShieldCheck className="w-16 h-16 text-[#D5D04A] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(213,208,74,0.3)]" />
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">LOCKED MATCH</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8 font-medium leading-relaxed">
                  This signal has a 95% verified success probability. Exclusive to VIP & VVIP members.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to={user ? "/payment" : "/register"} className="bg-[#D5D04A] text-black px-10 py-4 rounded-xl font-black uppercase italic text-xs tracking-widest shadow-lg shadow-[#D5D04A]/20 hover:bg-white hover:text-black transition-all">
                    Upgrade Access
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end justify-between mb-6 gap-8">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter">LIVE.<span className="text-primary">TICKETS</span></h2>
            <div className="technical-label text-primary opacity-100">Live Prediction Updates</div>
          </div>
          <div className="glass px-8 py-4 flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00C853]"></div>
            <span className="technical-label opacity-100 italic">System Online</span>
          </div>
        </div>

        <div className="space-y-8">
          {!isDataLoaded ? (
            <div className="p-40 text-center"><Loader2 className="w-16 h-16 animate-spin mx-auto text-primary opacity-30" /></div>
          ) : sortedDates.length > 0 ? (
            sortedDates.map(({ date, tips }, idx) => {
              const isOpen = expandedDates[date];
              const isToday = date === new Date().toISOString().split('T')[0];

              return (
                <motion.div 
                  key={date}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass group overflow-hidden hover:border-primary/20 transition-all"
                >
                  <button 
                    onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))}
                    className="w-full flex items-center justify-between p-10 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-8">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${isToday ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                          {isToday ? 'Today: Free Games' : date.replace(/-/g, '.')}
                        </div>
                        <div className="technical-label mt-2">{tips.length} Verified Entries</div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-8 h-8 text-primary" /> : <ChevronDown className="w-8 h-8 opacity-20" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-10 pb-10 space-y-6"
                      >
                        <div className="h-px bg-white/5 mb-8"></div>
                        {tips.map((p) => (
                          <div key={p.id} className="bg-white/5 border border-white/5 rounded-3xl p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:bg-white/10 transition-all card">
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <span className="technical-label px-4 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 italic">{p.league}</span>
                                <span className="technical-label flex items-center gap-2 italic"><Clock className="w-3 h-3" /> {p.kickoffTime}</span>
                              </div>
                              <h3 className="text-4xl font-black italic uppercase tracking-tight">{p.match}</h3>
                            </div>
                            
                            <div className="flex items-center gap-12 justify-between lg:justify-end">
                              <div className="text-right">
                                <div className="technical-label mb-2 italic">Expert Tip</div>
                                <div className="text-3xl font-black uppercase text-primary text-glow">{p.tip}</div>
                              </div>
                              <div className="bg-primary px-10 py-5 rounded-3xl text-center min-w-[140px] shadow-[0_10px_30px_rgba(0,153,255,0.3)]">
                                <div className="text-[10px] font-black text-black uppercase mb-1 italic opacity-60">Odds</div>
                                <div className="text-4xl font-black text-black">{p.odds}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <div className="p-40 text-center border-4 border-dashed border-white/5 rounded-5xl">
              <Layers className="w-16 h-16 mx-auto mb-8 text-primary opacity-20" />
              <div className="technical-label tracking-[0.6em]">Awaiting Matches...</div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-dark-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter">CLIENT <span className="text-primary text-glow">REVIEWS</span></h2>
            <div className="technical-label opacity-30 italic">Verified User Feedback</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {testimonials.map((t, idx) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="space-y-6 text-center"
              >
                <div className="text-gray-400 text-lg font-medium leading-relaxed italic">
                  "{t.content}"
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">{t.username}</div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${i < (t.rating || 5) ? 'bg-primary' : 'bg-white/10'}`}></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
              className="absolute inset-0 bg-[#050705]/95 backdrop-blur-3xl"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="vip-glow-card glass w-full max-w-xl p-12 relative overflow-hidden"
            >
              <button onClick={closePopup} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors z-20">
                <X className="w-8 h-8" />
              </button>
              
              <div className="relative z-10 space-y-10">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  {activeCoupon ? <Tag className="w-10 h-10 text-primary" /> : <Megaphone className="w-10 h-10 text-primary" />}
                </div>
                
                <div>
                  <h2 className="text-6xl font-black uppercase italic mb-6 tracking-tighter leading-none">
                    {activeCoupon ? (
                      <>UPGRADE <br /><span className="text-primary text-glow">-{activeCoupon.discount_percentage}%</span></>
                    ) : (
                      config.popup?.title || 'System Alert'
                    )}
                  </h2>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em] leading-loose opacity-60">
                    {activeCoupon ? (
                      "Get premium access with this exclusive discount code."
                    ) : (
                      config.popup?.content || "Special infrastructure updates available for VIP access nodes."
                    )}
                  </p>
                </div>

                {activeCoupon && (
                  <div 
                    className="bg-black/80 border-2 border-dashed border-primary/30 p-10 rounded-3xl text-center group cursor-pointer hover:border-primary transition-all overflow-hidden relative"
                    onClick={() => {
                      navigator.clipboard.writeText(activeCoupon.code);
                      alert("Auth Code Copied");
                    }}
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="technical-label mb-4 opacity-40">Discount Code</div>
                    <div className="text-5xl font-black text-primary tracking-[0.2em] mb-4 text-glow">{activeCoupon.code}</div>
                    <div className="technical-label text-primary opacity-100 flex items-center justify-center gap-3">
                      <Sparkles className="w-4 h-4" /> Copy Code
                    </div>
                  </div>
                )}

                <button onClick={closePopup} className="btn-primary w-full py-6">
                  {activeCoupon ? 'INITIALIZE UPGRADE' : 'ACKNOWLEDGE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
