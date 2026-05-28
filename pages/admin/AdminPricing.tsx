
import React, { useState, useEffect } from 'react';
import { DollarSign, Coins, TrendingUp, Database, Check, Copy } from 'lucide-react';
import { AppConfig } from '../../types';
import { DEFAULT_APP_CONFIG } from '../../constants';
import { supabase } from '../../lib/supabase';

const AdminPricing: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const SQL_FIX = `CREATE TABLE IF NOT EXISTS public.app_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    currency TEXT DEFAULT 'XAF',
    exchange_rate NUMERIC DEFAULT 600,
    logo TEXT,
    "momoNumber" TEXT,
    "momoName" TEXT,
    "btcAddress" TEXT,
    "usdtAddress" TEXT,
    "ltcAddress" TEXT,
    "ethAddress" TEXT,
    "solAddress" TEXT,
    popup JSONB DEFAULT '{"active": false, "title": "Welcome", "content": "Special Promo"}'::jsonb,
    prices JSONB DEFAULT '{"vip-7": 5000, "vip-14": 9000, "vip-30": 15000, "vvip-30": 35000}'::jsonb,
    CONSTRAINT one_row_only CHECK (id = 1)
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app_config" ON public.app_config;
DROP POLICY IF EXISTS "Admin update app_config" ON public.app_config;

CREATE POLICY "Public read app_config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Admin update app_config" ON public.app_config FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

INSERT INTO public.app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data, error } = await supabase.from('app_config').select('*').maybeSingle();
    if (error) {
      setErrorStatus({ message: error.message, code: error.code });
    } else if (data) {
      setConfig(data);
      setErrorStatus(null);
    }
  };

  const handleUpdatePrices = async () => {
    setLoading(true);
    const { error } = await supabase.from('app_config').upsert({ ...config, id: 1 }, { onConflict: 'id' });
    if (!error) {
      alert(`Success: System switched to ${config.currency} and prices updated!`);
      setErrorStatus(null);
      fetchConfig();
    } else {
      setErrorStatus({ message: error.message, code: error.code });
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_FIX);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSchemaError = errorStatus?.code === '42P01' || 
                        errorStatus?.message.includes('relation "public.app_config" does not exist') ||
                        errorStatus?.message.includes('violates row-level security');

  if (isSchemaError) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass p-12 rounded-[4rem] border-red-500/20 bg-red-500/5 text-center space-y-8">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500">
            <Database className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-red-500">Infrastructure Node Offline</h2>
            <p className="text-gray-400 font-black uppercase text-[11px] tracking-[0.2em] max-w-lg mx-auto leading-loose">
              Database synchronization failed. Run this SQL to restore the Pricing & Configuration module.
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
          <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase italic tracking-[0.3em] text-[11px]">Reload System</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/60 shadow-2xl border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#00C853] flex items-center gap-3">
            <Coins className="w-8 h-8" /> System Currency
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2">Active currency node for checkout</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-black/40 p-2 rounded-2xl border border-white/5">
          <button 
            onClick={() => setConfig({...config, currency: 'XAF'})}
            className={`px-10 py-4 rounded-xl font-black text-xs uppercase italic transition-all ${config.currency === 'XAF' ? 'bg-[#00C853] text-black shadow-lg shadow-[#00C853]/20' : 'text-gray-500 hover:text-white'}`}
          >
            XAF (Main)
          </button>
          <button 
            onClick={() => setConfig({...config, currency: 'USD'})}
            className={`px-10 py-4 rounded-xl font-black text-xs uppercase italic transition-all ${config.currency === 'USD' ? 'bg-[#00C853] text-black shadow-lg shadow-[#00C853]/20' : 'text-gray-500 hover:text-white'}`}
          >
            USD
          </button>
        </div>
      </div>

      <div className="glass p-12 rounded-[4rem] space-y-12 bg-white dark:bg-black/60 shadow-2xl border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
           <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#00C853]">Price Listings</h3>
           <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-4 py-2 rounded-xl">Values in {config.currency}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 pb-2">VIP TIER SLIPS</h4>
            {['vip-7', 'vip-14', 'vip-30'].map(p => (
              <div key={p} className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">{p.replace('-', ' ')} Days</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{config.currency}</span>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#00C853] font-black"
                    value={config.prices[p] || 0}
                    onChange={(e) => setConfig({...config, prices: {...config.prices, [p]: parseFloat(e.target.value) || 0}})}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#FFD700] pb-2">VVIP ELITE ACCESS</h4>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">VVIP 30 Days</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{config.currency}</span>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 dark:bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#FFD700] font-black text-[#FFD700]"
                  value={config.prices['vvip-30'] || 0}
                  onChange={(e) => setConfig({...config, prices: {...config.prices, 'vvip-30': parseFloat(e.target.value) || 0}})}
                />
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Global Exchange Rate</h4>
              <div className="relative">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00C853]" />
                <input 
                  type="number" 
                  placeholder="Rate: 1 USD = ? XAF"
                  className="w-full bg-slate-50 dark:bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#00C853] font-black text-xs"
                  value={config.exchange_rate || 600}
                  onChange={(e) => setConfig({...config, exchange_rate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic text-center">Reference: 1 USD = {config.exchange_rate} XAF</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleUpdatePrices} 
          disabled={loading}
          className="w-full bg-[#00C853] text-black py-6 rounded-3xl font-black uppercase italic tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#00C853]/30 disabled:opacity-50"
        >
          {loading ? 'Syncing Schema...' : 'Deploy Global Pricing'}
        </button>
      </div>
    </div>
  );
};

export default AdminPricing;
