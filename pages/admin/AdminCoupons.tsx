
import React, { useState, useEffect } from 'react';
import { Ticket, Trash2, Database, Copy, Check, Percent } from 'lucide-react';
import { Coupon } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

const AdminCoupons: React.FC = () => {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 10 });
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const SQL_FIX = `-- Clear old schema and recreate with percentage support
DROP TABLE IF EXISTS public.coupons;

CREATE TABLE public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    "isActive" BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access on coupons" 
ON public.coupons FOR ALL 
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

CREATE POLICY "Users can view coupons" 
ON public.coupons FOR SELECT 
TO authenticated
USING (true);`;

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('coupons').select('*');
      if (error) {
        setErrorStatus({ message: error.message, code: error.code });
      } else if (data) {
        setCoupons(data);
        setErrorStatus(null);
      }
    } catch (err: any) {
      setErrorStatus({ message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;

    const { error } = await supabase.from('coupons').insert([{ 
      code: newCoupon.code.toUpperCase().trim(), 
      discount_percentage: newCoupon.discount, 
      isActive: true 
    }]);
    
    if (error) {
      showToast("Error creating coupon: " + error.message, "error");
    } else {
      showToast(`${newCoupon.discount}% discount activated!`, "success");
      setNewCoupon({ code: '', discount: 10 });
      fetchCoupons();
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Deactivate this coupon code?")) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (!error) {
      showToast("Coupon deleted successfully.", "success");
      fetchCoupons();
    } else {
      showToast("Delete failed: " + error.message, "error");
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_FIX);
    setCopied(true);
    showToast("SQL Code copied to clipboard", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const isSchemaError = errorStatus?.code === 'PGRST205' || 
                        errorStatus?.code === 'PGRST204' || 
                        errorStatus?.code === '42P01' || 
                        errorStatus?.message.includes('discount_percentage') ||
                        errorStatus?.message.includes('coupons');

  if (isSchemaError) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass p-12 rounded-[4rem] border-red-500/20 bg-red-500/5 text-center space-y-8">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500">
            <Database className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-red-500">Schema Update Required</h2>
            <p className="text-gray-400 font-black uppercase text-[11px] tracking-[0.2em] max-w-lg mx-auto leading-loose">
              Database upgrade needed. Run the SQL below to sync the percentage-based coupon system.
            </p>
          </div>
          <div className="relative group">
            <pre className="bg-black/60 p-8 rounded-[2rem] text-left text-[10px] font-mono text-blue-400 overflow-x-auto border border-white/5 scrollbar-hide max-h-72 overflow-y-auto">
              {SQL_FIX}
            </pre>
            <button onClick={copySql} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase">
              {copied ? <Check className="w-4 h-4 text-[#00C853]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy SQL'}
            </button>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase italic tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            I've run the SQL, Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4">
        <form onSubmit={handleCreateCoupon} className="glass p-10 rounded-[3rem] bg-white dark:bg-black/60 shadow-xl space-y-6 border-white/5">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#00C853]">New Promotion</h2>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block px-2">Unique Code</label>
            <input 
              type="text" 
              placeholder="e.g. FLASH25" 
              className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-center font-mono font-black text-xl tracking-widest outline-none focus:border-[#00C853]/50 text-slate-900 dark:text-white" 
              value={newCoupon.code} 
              onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} 
              required 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block px-2">Discount Percentage (%)</label>
            <div className="relative">
              <Percent className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="number" 
                min="0" 
                max="100"
                className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-center font-black text-2xl outline-none focus:border-[#00C853]/50 pl-14 text-slate-900 dark:text-white" 
                value={newCoupon.discount} 
                onChange={e => setNewCoupon({...newCoupon, discount: parseInt(e.target.value) || 0})} 
                required 
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-[#00C853] text-black py-5 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-lg shadow-[#00C853]/20 transition-transform active:scale-95">
            Activate Promotion
          </button>
        </form>
      </div>
      <div className="lg:col-span-8 space-y-6">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Live Vouchers</h2>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-[2.5rem]"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map(c => (
              <div key={c.id} className="glass p-8 rounded-[2.5rem] flex items-center justify-between bg-white dark:bg-black/40 border-white/5 group hover:border-[#00C853]/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-[#00C853]/10 p-3 rounded-xl"><Ticket className="w-6 h-6 text-[#00C853]" /></div>
                  <div>
                    <div className="text-2xl font-mono font-black text-[#00C853] tracking-widest">{c.code}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      SAVE {c.discount_percentage}% OFF
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteCoupon(c.id)} className="p-4 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="col-span-full p-20 text-center opacity-30 border-2 border-dashed border-white/10 rounded-[3rem]">
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">NO ACTIVE VOUCHERS</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
