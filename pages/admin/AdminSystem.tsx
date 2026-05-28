
import React, { useState, useEffect } from 'react';
import { Camera, Trophy, Bitcoin, DollarSign, Wallet, Hash, Database, Copy, Check, Megaphone, Bell, Sparkles } from 'lucide-react';
import { AppConfig } from '../../types';
import { DEFAULT_APP_CONFIG } from '../../constants';
import { supabase } from '../../lib/supabase';

const AdminSystem: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [errorStatus, setErrorStatus] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).maybeSingle();
      if (error) {
        setErrorStatus({ message: error.message, code: error.code });
      } else if (data) {
        setConfig(data);
        setErrorStatus(null);
      }
    } catch (err) {
      console.error("Config sync error");
    }
  };

  const handleUpdate = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const { error } = await supabase
        .from('app_config')
        .upsert({ ...config, id: 1 }, { onConflict: 'id' });

      if (error) throw error;
      alert("System Updated Successfully!");
      setErrorStatus(null);
    } catch (error: any) { 
      console.error("Sync Failure:", error);
      alert("Sync Failure: " + (error.message || "Unknown Connection Error")); 
      setErrorStatus({ message: error.message });
    } finally {
      clearTimeout(timeout);
      setIsSaving(false);
      fetchConfig();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large (Max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setConfig({ ...config, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto glass p-10 md:p-14 rounded-[4rem] space-y-12 bg-white dark:bg-black/60 shadow-2xl border-white/5 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#00C853]">System Infrastructure</h2>
        <div className="bg-[#00C853]/10 px-6 py-3 rounded-2xl border border-[#00C853]/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-[#00C853] tracking-widest text-center">Cloud Master Secure</span>
        </div>
      </div>
      
      {/* Platform Branding */}
      <div className="space-y-6">
        <div className="flex items-center gap-8 bg-slate-100 dark:bg-white/5 p-8 rounded-[3rem] border border-white/5">
          <div className="w-28 h-28 bg-white dark:bg-black/40 rounded-[2rem] flex items-center justify-center overflow-hidden border border-white/10 group relative shadow-inner">
            {config.logo ? <img src={config.logo} className="w-full h-full object-contain" /> : <Trophy className="w-12 h-12 text-gray-700" />}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
              <Camera className="w-6 h-6 text-[#00C853]" />
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
          </div>
          <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-black uppercase tracking-wider mb-2">Platform Branding Node</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">Update your master logo here. Preferred format: Transparent PNG or SVG.</p>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-white/5 p-8 rounded-[3rem] border border-white/5">
          <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block px-2 tracking-widest">YouTube Video (ID or Full Link)</label>
          <input 
            type="text" 
            placeholder="e.g. lUDFmed5Nvk or https://youtu.be/..." 
            className="w-full bg-white dark:bg-black/40 border border-white/10 p-5 rounded-2xl font-bold text-xs outline-none focus:border-[#00C853]/40" 
            value={config.youtube_video_id || ''} 
            onChange={e => {
              let val = e.target.value;
              const match = val.match(/(?:youtu\.be\/|youtube\.com\/(?:.*[?&]v=|embed\/))([\w-]{11})/);
              if (match && match[1]) {
                val = match[1];
              }
              setConfig({...config, youtube_video_id: val});
            }} 
          />
          <p className="text-[9px] text-gray-400 mt-3 px-2">Paste a full YouTube link, and it will automatically extract the ID for you.</p>
        </div>
      </div>

      {/* System Popup / Discount Alerts */}
      <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[3.5rem] border border-white/5 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00C853]/5 blur-[80px] rounded-full"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h3 className="text-xl font-black italic uppercase text-[#00C853] flex items-center gap-3">
              <Bell className="w-5 h-5" /> Global System Alert
            </h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1">Triggers modal on user entry</p>
          </div>
          <button 
            onClick={() => setConfig({...config, popup: {...config.popup, active: !config.popup.active}})} 
            className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg ${config.popup.active ? 'bg-[#00C853] text-black shadow-[#00C853]/30' : 'bg-white/10 text-gray-500'}`}
          >
            {config.popup.active ? 'NODE ACTIVE' : 'NODE OFFLINE'}
          </button>
        </div>
        
        <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block px-2 tracking-widest">Popup Header</label>
                <input type="text" placeholder="Title" className="w-full bg-white dark:bg-black/40 border border-white/10 p-5 rounded-2xl font-black text-xs uppercase outline-none focus:border-[#00C853]/40" value={config.popup.title || ''} onChange={e => setConfig({...config, popup: {...config.popup, title: e.target.value}})} />
              </div>
              <div className="flex items-end">
                <div className="w-full p-4 bg-[#00C853]/5 rounded-2xl border border-[#00C853]/10 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#00C853]" />
                  <span className="text-[8px] font-black text-[#00C853] uppercase leading-tight">Note: If an active coupon exists, it will override this content on the home page.</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block px-2 tracking-widest">Popup Message</label>
              <textarea placeholder="Message Content" className="w-full bg-white dark:bg-black/40 border border-white/10 p-5 rounded-2xl h-28 resize-none text-xs font-medium leading-loose outline-none focus:border-[#00C853]/40" value={config.popup.content || ''} onChange={e => setConfig({...config, popup: {...config.popup, content: e.target.value}})} />
            </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">MOMO GATEWAY</h3>
            <div className="flex-1 h-px bg-white/5"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 px-2">Merchant Number</label>
            <input type="text" placeholder="+237 ..." className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#00C853]/50" value={config.momoNumber || ''} onChange={e => setConfig({...config, momoNumber: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 px-2">Merchant Name</label>
            <input type="text" placeholder="BETTABETS XAF" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#00C853]/50" value={config.momoName || ''} onChange={e => setConfig({...config, momoName: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">CRYPTO NODES</h3>
            <div className="flex-1 h-px bg-white/5"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-2">
                <Bitcoin className="w-3 h-3 text-[#f7931a]" /> Bitcoin (BTC)
            </label>
            <input type="text" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-[10px] font-mono outline-none focus:border-[#f7931a]/50" value={config.btcAddress || ''} onChange={e => setConfig({...config, btcAddress: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-[#26a17b]" /> USDT (TRC20)
            </label>
            <input type="text" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-[10px] font-mono outline-none focus:border-[#26a17b]/50" value={config.usdtAddress || ''} onChange={e => setConfig({...config, usdtAddress: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-2">
                <Hash className="w-3 h-3 text-[#627eea]" /> Ethereum (ETH)
            </label>
            <input type="text" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-[10px] font-mono outline-none focus:border-[#627eea]/50" value={config.ethAddress || ''} onChange={e => setConfig({...config, ethAddress: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-2">
                <Wallet className="w-3 h-3 text-[#a3a3a3]" /> Litecoin (LTC)
            </label>
            <input type="text" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-[10px] font-mono outline-none focus:border-white/20" value={config.ltcAddress || ''} onChange={e => setConfig({...config, ltcAddress: e.target.value})} />
          </div>
        </div>
      </div>

      <button 
        onClick={handleUpdate} 
        disabled={isSaving} 
        className={`w-full bg-[#00C853] text-black py-7 rounded-[2rem] font-black uppercase italic text-xs tracking-[0.4em] hover:scale-[1.01] active:scale-95 transition-all shadow-[0_20px_60px_rgba(0,200,83,0.3)] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSaving ? 'DEPLOYING CHANGES...' : 'SAVE INFRASTRUCTURE NODE'}
      </button>
    </div>
  );
};

export default AdminSystem;
