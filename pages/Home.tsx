
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
      <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-between px-6 max-w-7xl mx-auto py-12 md:py-20 lg:flex-row gap-12">
        <div 
          className="absolute inset-0 -z-10 w-full h-full opacity-30 pointer-events-none bg-cover bg-center [mask-image:linear-gradient(to_bottom,white,transparent)] md:[mask-image:linear-gradient(to_left,white,transparent)]"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=2000&auto=format&fit=crop')` }}
        ></div>
        
        <div className="w-full lg:w-1/2 relative z-10 text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-2"
          >
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Premium Soccer Analytics</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
          >
            Elevate Your <br />
            <span className="text-primary">Betting Game.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-gray-400 text-lg max-w-lg mb-8 leading-relaxed"
          >
            Get access to expert match analysis, verified insights, and high-confidence tips to maximize your consistency.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to={user ? "/dashboard" : "/register"} className="btn-primary w-full sm:w-auto text-center">Get Started</Link>
            <button 
              onClick={() => document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' })} 
              className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10"
            >
              View Matches
            </button>
          </motion.div>
        </div>

        {/* Video Player */}
        {config.youtube_video_id && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2 relative z-10"
          >
            <div className="aspect-video w-full rounded-2xl overflow-hidden glass shadow-2xl relative group">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${config.youtube_video_id}?autoplay=0&rel=0`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0"
              ></iframe>
            </div>
          </motion.div>
        )}
      </section>

      {/* Ticker Section */}
      <div className="bg-[#D5D04A] border-y border-white/5 py-3 overflow-hidden relative z-10 backdrop-blur-md">
        <div className="flex whitespace-nowrap overflow-hidden py-1" style={{ animation: `scroll ${config.ticker_speed || 40}s linear infinite` }}>
          {[...tickerMessages, ...tickerMessages, ...tickerMessages, ...tickerMessages].map((msg, i) => (
            <div key={i} className="inline-flex items-center mx-8">
              <Activity className="w-3 h-3 mr-2 text-primary" />
              <span className="text-xs font-semibold tracking-wider text-black">{msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Free Slips Section and Surest Win */}
      <section id="market" className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Surest Win of the Day */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Match of the Day
            </h2>
            <div className="hidden md:flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 text-primary text-xs font-bold tracking-wider">
              High Confidence
            </div>
          </div>
          
          <div className="glass p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
            
            {!surestPrediction ? (
               <div className="text-center py-6">
                 <ShieldCheck className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                 <p className="text-gray-400 font-medium text-sm">Analyzing today's matches...</p>
               </div>
            ) : user?.subscription === 'VIP' || user?.subscription === 'VVIP' ? (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-md text-gray-300">
                      {surestPrediction.league}
                    </span>
                    <span className="text-xs flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3.5 h-3.5" /> {surestPrediction.kickoffTime}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mt-2">{surestPrediction.match}</h3>
                </div>
                
                <div className="flex items-center gap-6 justify-between lg:justify-end">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Our Pick</div>
                    <div className="text-xl font-bold text-primary">
                      {surestPrediction.tip}
                    </div>
                  </div>
                  <div className="bg-white/10 px-6 py-3 rounded-xl text-center min-w-[100px]">
                    <div className="text-[10px] text-gray-400 uppercase mb-1">Odds</div>
                    <div className="text-2xl font-bold text-white">{surestPrediction.odds}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 relative z-10">
                <ShieldCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Premium Pick Locked</h3>
                <p className="text-gray-400 max-w-sm mx-auto mb-6 text-sm">
                  Exclusive to premium members. Upgrade your plan to view this tip.
                </p>
                <Link to={user ? "/payment" : "/register"} className="btn-primary inline-flex px-8">
                  Upgrade to View
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="w-6 h-6 text-primary" />
            Today's Picks
          </h2>
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
                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isToday ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xl font-bold tracking-tight">
                          {isToday ? 'Today: Free Games' : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{tips.length} Verified Entries</div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-6 h-6 text-primary" /> : <ChevronDown className="w-6 h-6 opacity-20" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-4"
                      >
                        <div className="h-px bg-white/5 mb-4"></div>
                        {tips.map((p) => (
                          <div key={p.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-white/10 transition-all card">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">{p.league}</span>
                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5"><Clock className="w-3 h-3" /> {p.kickoffTime}</span>
                              </div>
                              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">{p.match}</h3>
                            </div>
                            
                            <div className="flex items-center gap-6 justify-between lg:justify-end">
                              <div className="text-right">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Expert Tip</div>
                                <div className="text-xl font-bold text-primary">{p.tip}</div>
                              </div>
                              <div className="bg-white/10 px-6 py-3 rounded-xl text-center min-w-[80px]">
                                <div className="text-[10px] text-gray-400 uppercase mb-1">Odds</div>
                                <div className="text-lg font-bold text-white">{p.odds}</div>
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
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">What Our Clients Say</h2>
            <p className="text-gray-400 text-sm">Verified feedback from our community.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="glass p-8 text-center space-y-6"
              >
                <div className="text-gray-300 text-sm leading-relaxed">
                  "{t.content}"
                </div>
                <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/10">
                  <div className="text-sm font-semibold">{t.username}</div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (t.rating || 5) ? 'bg-primary' : 'bg-white/10'}`}></div>
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
                  <h2 className="text-4xl font-bold tracking-tight mb-4">
                    {activeCoupon ? (
                      <>UPGRADE <br /><span className="text-primary">-{activeCoupon.discount_percentage}%</span></>
                    ) : (
                      config.popup?.title || 'System Alert'
                    )}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {activeCoupon ? (
                      "Get premium access with this exclusive discount code."
                    ) : (
                      config.popup?.content || "Special infrastructure updates available for VIP access nodes."
                    )}
                  </p>
                </div>

                {activeCoupon && (
                  <div 
                    className="bg-black/40 border border-primary/30 p-6 rounded-2xl text-center group cursor-pointer hover:border-primary transition-all relative"
                    onClick={() => {
                      navigator.clipboard.writeText(activeCoupon.code);
                      alert("Discount Code Copied");
                    }}
                  >
                    <div className="text-xs text-gray-400 uppercase mb-2">Discount Code</div>
                    <div className="text-4xl font-bold text-primary mb-3">{activeCoupon.code}</div>
                    <div className="text-xs font-semibold text-primary flex items-center justify-center gap-2">
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
