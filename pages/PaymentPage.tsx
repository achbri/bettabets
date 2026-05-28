
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, PaymentStatus, AppConfig, Coupon } from '../types';
import { PLANS_TEMPLATE, DEFAULT_APP_CONFIG } from '../constants';
import { CheckCircle, Upload, ArrowLeft, Tag, Smartphone, Bitcoin, DollarSign, Wallet, ShieldCheck, Hash, CircleDollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

import { useAuth } from '../lib/AuthContext';

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const { showToast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'BTC' | 'USDT' | 'LTC' | 'ETH' | 'SOL'>('MOMO');
  const [proofFile, setProofFile] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('app_config').select('logo, momoNumber, momoName, btcAddress, usdtAddress, ltcAddress, ethAddress, solAddress, prices, currency').maybeSingle();
      if (data) setConfig(data as any);
    };
    fetchConfig();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    const { data: coupons } = await supabase
      .from('coupons')
      .select('code, discount_percentage, isActive')
      .eq('code', couponCode.toUpperCase().trim())
      .eq('isActive', true)
      .maybeSingle();

    if (coupons) {
      setAppliedCoupon(coupons as Coupon);
      showToast(`${coupons.discount_percentage}% discount applied!`, "success");
    } else {
      showToast('Invalid or expired coupon code.', "error");
    }
  };

  // Helper to compress image before upload to prevent network lag
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compressing to 70% quality
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File is too large! Please upload a smaller image.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        // Compress it immediately
        const compressed = await compressImage(result);
        setProofFile(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculatePrice = (planId: string) => {
    const basePrice = config.prices[planId] || 0;
    if (!appliedCoupon) return basePrice;
    const discountAmount = (basePrice * appliedCoupon.discount_percentage) / 100;
    return Math.max(0, basePrice - discountAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !proofFile) return;

    setIsSubmitting(true);
    const plan = PLANS_TEMPLATE.find(p => p.id === selectedPlanId);
    const finalPrice = calculatePrice(selectedPlanId);

    const newRequest = {
      userId: user.id,
      username: user.username,
      plan: plan?.name || 'Plan',
      amount: `${config.currency} ${finalPrice.toLocaleString()}`,
      proofUrl: proofFile,
      status: PaymentStatus.PENDING,
      date: new Date().toISOString(),
      method: paymentMethod
    };

    try {
      const { error } = await supabase.from('payment_requests').insert([newRequest]);
      if (!error) {
        setSubmitted(true);
        showToast("Payment proof submitted!", "success");
      } else {
        showToast("Submission failed: " + error.message, "error");
      }
    } catch (err) {
      showToast("A network error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-in zoom-in duration-300">
        <div className="bg-[#00C853]/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-[#00C853] shadow-[0_0_50px_rgba(0,200,83,0.3)]"><CheckCircle className="w-12 h-12" /></div>
        <h1 className="text-4xl font-black uppercase italic mb-4 tracking-tighter">Receipt Logged</h1>
        <p className="text-gray-400 mb-12 text-lg uppercase font-black tracking-tight opacity-70">
          Analysis team is verifying your <span className="text-[#00C853]">{config.currency} payment</span>. Access unlocks in <span className="text-white">6-24 Hours</span>.
        </p>
        <button onClick={() => navigate('/dashboard')} className="w-full bg-[#00C853] text-black py-6 rounded-3xl font-black uppercase italic tracking-[0.3em] text-xs shadow-xl shadow-[#00C853]/30">DASHBOARD HOME</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-14">
        <button onClick={() => navigate(-1)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-white/5"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Activate <span className="text-[#00C853]">VIP</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">SYSTEM CURRENCY: {config.currency} • SECURE NODE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-white/5">
            <h2 className="text-2xl font-black mb-8 italic uppercase tracking-tighter text-[#00C853]">1. Select Your Tier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PLANS_TEMPLATE.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-8 rounded-[2.5rem] text-left border-2 transition-all relative overflow-hidden group ${selectedPlanId === plan.id ? 'border-[#00C853] bg-[#00C853]/5 shadow-[0_0_30px_rgba(0,200,83,0.1)]' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em]">{plan.type}</span>
                    <span className="text-2xl font-black text-[#00C853] tracking-tighter">
                      {config.currency} {config.prices[plan.id]?.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-black text-xl leading-tight uppercase italic text-slate-900 dark:text-white group-hover:text-[#00C853] transition-colors">{plan.name}</h3>
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-white/5">
            <h2 className="text-2xl font-black mb-8 italic uppercase tracking-tighter text-[#00C853]">2. Checkout Gate</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
              {[
                { id: 'MOMO', label: 'MOMO', icon: Smartphone },
                { id: 'BTC', label: 'BTC', icon: Bitcoin },
                { id: 'USDT', label: 'USDT', icon: DollarSign },
                { id: 'ETH', label: 'ETH', icon: Hash },
                { id: 'LTC', label: 'LTC', icon: Wallet },
                { id: 'SOL', label: 'SOL', icon: CircleDollarSign },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === method.id ? 'border-[#00C853] bg-[#00C853]/10 shadow-lg' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                >
                  <method.icon className={`w-6 h-6 ${paymentMethod === method.id ? 'text-[#00C853]' : 'text-gray-500'}`} />
                  <span className="text-[9px] font-black uppercase text-center leading-tight tracking-widest">{method.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-slate-100 dark:bg-black/60 p-10 rounded-[2.5rem] border border-slate-200 dark:border-[#00C853]/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C853]/5 blur-3xl rounded-full"></div>
              <div className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00C853]" /> PAYMENT DESTINATION NODE
              </div>
              
              {paymentMethod === 'MOMO' ? (
                <div className="space-y-2">
                  <div className="text-3xl font-mono font-black text-slate-900 dark:text-white tracking-widest">{config.momoNumber}</div>
                  <div className="text-sm font-black text-[#00C853] italic uppercase tracking-tighter">{config.momoName}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono break-all font-black text-[#00C853] leading-relaxed uppercase bg-black/20 p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                    <span>
                      {paymentMethod === 'BTC' ? config.btcAddress : 
                       paymentMethod === 'USDT' ? config.usdtAddress : 
                       paymentMethod === 'ETH' ? config.ethAddress : 
                       paymentMethod === 'LTC' ? config.ltcAddress : 
                       config.solAddress}
                    </span>
                  </div>
                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Network: {
                    paymentMethod === 'BTC' ? 'Bitcoin Native' : 
                    paymentMethod === 'USDT' ? 'TRC20 Network' : 
                    paymentMethod === 'ETH' ? 'ERC20 / Mainnet' : 
                    paymentMethod === 'LTC' ? 'Litecoin Native' : 
                    'Solana Network'
                  }</div>
                </div>
              )}
              
              <div className="mt-8 p-4 bg-[#00C853]/5 rounded-2xl text-[9px] text-[#00C853] font-black uppercase tracking-[0.3em] text-center border border-[#00C853]/10">
                TAKE SCREENSHOT AFTER TRANSFER
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-white/5">
            <h2 className="text-xl font-black mb-6 italic uppercase tracking-tighter flex items-center gap-3"><Tag className="w-5 h-5 text-[#00C853]" /> Promo Entry</h2>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="VOUCHER CODE"
                className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:border-[#00C853]/50 text-slate-900 dark:text-white tracking-widest"
              />
              <button onClick={handleApplyCoupon} className="bg-[#00C853] text-black px-6 rounded-2xl text-[10px] font-black uppercase italic hover:scale-105 active:scale-95 transition-all">Apply</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 sticky top-24 border-[#00C853]/10 shadow-2xl">
            <h2 className="text-xl font-black mb-8 italic uppercase tracking-tighter">3. Proof Upload</h2>
            <div className="mb-8 relative group border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] p-12 text-center hover:border-[#00C853]/40 transition-all cursor-pointer bg-slate-50 dark:bg-black/20">
              <input type="file" required onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
              {proofFile ? (
                <div className="space-y-4">
                    <img src={proofFile} alt="Proof" className="w-full h-32 object-contain rounded-2xl" />
                    <div className="text-[9px] font-black uppercase text-[#00C853]">Document Attached ✓</div>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-4 text-gray-500 group-hover:text-[#00C853] transition-colors" />
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-loose">Attach Receipt<br/>PNG/JPG/SVG</div>
                </>
              )}
            </div>
            
            <div className="mb-8 p-6 bg-slate-100 dark:bg-black/40 rounded-3xl space-y-4 border border-white/5">
              <div className="flex justify-between text-[11px] font-black uppercase text-gray-500 tracking-widest">
                <span>Subtotal:</span>
                <span className="text-slate-900 dark:text-white">{config.currency} {selectedPlanId ? config.prices[selectedPlanId]?.toLocaleString() : '0'}</span>
              </div>
              <div className="h-px bg-white/5 my-2"></div>
              <div className="flex justify-between font-black italic uppercase text-2xl tracking-tighter">
                <span className="text-slate-900 dark:text-white">Total:</span>
                <span className="text-[#00C853]">{config.currency} {selectedPlanId ? calculatePrice(selectedPlanId).toLocaleString() : '0'}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!selectedPlanId || !proofFile || isSubmitting} 
              className="w-full bg-[#00C853] text-black py-6 rounded-3xl font-black uppercase italic tracking-[0.3em] text-[11px] disabled:opacity-50 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,200,83,0.3)] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PROCESSING...
                </>
              ) : 'FINALIZE ORDER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
