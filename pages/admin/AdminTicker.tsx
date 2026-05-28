
import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2, Database, Check, Copy, Power, Plus, Loader2, AlertCircle, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { AppConfig } from '../../types';
import { DEFAULT_APP_CONFIG } from '../../constants';

interface TickerMessage {
  id: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

const AdminTicker: React.FC = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingSpeed, setIsUpdatingSpeed] = useState(false);
  const [errorStatus, setErrorStatus] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const SQL_FIX = `CREATE TABLE IF NOT EXISTS public.ticker_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fix for Ticker Speed: Add missing column to app_config
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS ticker_speed INTEGER DEFAULT 40;

ALTER TABLE public.ticker_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ticker" ON public.ticker_messages;
DROP POLICY IF EXISTS "Admin full access ticker" ON public.ticker_messages;

CREATE POLICY "Public read ticker" ON public.ticker_messages FOR SELECT USING (true);
CREATE POLICY "Admin full access ticker" ON public.ticker_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

INSERT INTO public.ticker_messages (content) VALUES 
('User *823 won XAF 150,000 on Serie A Ticket'),
('VIP Member @J*** just cleared 5.5 Odds'),
('VVIP Rollover Day 4 Success! Verified');`;

  useEffect(() => {
    fetchTickerMessages();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).maybeSingle();
      if (error) {
        // Catch column missing error (42703)
        if (error.code === '42703') {
           setErrorStatus({ message: 'Missing ticker_speed column', code: error.code });
        }
      }
      if (data) setConfig(data as AppConfig);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickerMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticker_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        setErrorStatus({ message: error.message, code: error.code });
      } else if (data) {
        setMessages(data);
        setErrorStatus(null);
      }
    } catch (err: any) {
      setErrorStatus({ message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpeed = async (newSpeed: number) => {
    // Update local state immediately for snappy UI
    setConfig(prev => ({ ...prev, ticker_speed: newSpeed }));
    
    setIsUpdatingSpeed(true);
    const { error } = await supabase.from('app_config').update({ ticker_speed: newSpeed }).eq('id', 1);
    
    if (error) {
      console.error("Update speed error:", error);
      if (error.code === '42703') {
        setErrorStatus({ message: 'Database needs update: ticker_speed column missing', code: error.code });
      }
      showToast("Failed to update speed in database", "error");
    } else {
      showToast(`Ticker speed set to ${newSpeed}s`, "success");
      setErrorStatus(null);
    }
    setIsUpdatingSpeed(false);
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('ticker_messages')
      .insert([{ content: newMessage.trim(), is_active: true }]);

    if (error) {
      showToast("Failed to add message: " + error.message, "error");
    } else {
      showToast("Ticker message published!", "success");
      setNewMessage('');
      fetchTickerMessages();
    }
    setIsSaving(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('ticker_messages')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      showToast(`Message ${!currentStatus ? 'activated' : 'deactivated'}`, "info");
      fetchTickerMessages();
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Permanently delete this ticker message?")) return;
    const { error } = await supabase.from('ticker_messages').delete().eq('id', id);
    if (!error) {
      showToast("Message purged", "info");
      fetchTickerMessages();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_FIX);
    setCopied(true);
    showToast("SQL Code copied", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  // Check for table missing (42P01) or column missing (42703)
  const isSchemaError = errorStatus?.code === '42P01' || 
                        errorStatus?.code === '42703' || 
                        errorStatus?.message.includes('relation "public.ticker_messages" does not exist') ||
                        errorStatus?.message.includes('ticker_speed');

  if (isSchemaError) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass p-12 rounded-[4rem] border-primary/20 bg-primary/5 text-center space-y-8">
          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary">
            <Database className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-primary">Schema Sync Required</h2>
            <p className="text-gray-400 font-black uppercase text-[11px] tracking-[0.2em] max-w-lg mx-auto leading-loose">
              {errorStatus?.code === '42703' 
                ? 'The "ticker_speed" column is missing from your configuration table.' 
                : 'Database synchronization failed. Ticker module structure is incomplete.'}
              <br/>Run the SQL below in your Supabase SQL Editor to fix this.
            </p>
          </div>
          <div className="relative group">
            <pre className="bg-black/60 p-8 rounded-[2rem] text-left text-[10px] font-mono text-blue-400 overflow-x-auto border border-white/5 scrollbar-hide max-h-72">
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 space-y-6">
        {/* Speed Slider Section */}
        <div className="glass p-10 rounded-[3rem] bg-white dark:bg-black/60 shadow-xl space-y-6 border-white/5">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary flex items-center gap-3">
            <Trophy className="w-6 h-6" /> Scroll Speed
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
              <span>Fast (10s)</span>
              <span className="text-white">Current: {config.ticker_speed || 40}s</span>
              <span>Slow (120s)</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="120" 
              step="5"
              disabled={isUpdatingSpeed}
              value={config.ticker_speed || 40}
              onChange={(e) => handleUpdateSpeed(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
            />
            <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed text-center italic">
              Lower seconds = Faster scrolling
            </p>
          </div>
        </div>

        <form onSubmit={handleAddMessage} className="glass p-10 rounded-[3rem] bg-white dark:bg-black/60 shadow-xl space-y-6 border-white/5 sticky top-24">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary flex items-center gap-3">
            <Plus className="w-6 h-6" /> Add Content
          </h2>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block px-2">Ticker Message</label>
            <textarea 
              placeholder="e.g. New VIP Member from Kenya just joined!" 
              className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#00C853]/50 text-slate-900 dark:text-white h-32 resize-none" 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isSaving || !newMessage.trim()}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish to Ticker'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Live Ticker Feed</h2>
          <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-primary tracking-widest">{messages.length} Items</span>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-[2.5rem]"></div>)}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`glass p-8 rounded-[2.5rem] flex items-center justify-between bg-white dark:bg-black/40 border transition-all ${m.is_active ? 'border-white/5' : 'border-red-500/10 opacity-50 grayscale'}`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${m.is_active ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-gray-500/10 text-gray-500'}`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm leading-relaxed text-slate-900 dark:text-white italic">
                    {m.content}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={() => toggleStatus(m.id, m.is_active)}
                    className={`p-3 rounded-xl transition-all ${m.is_active ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white'}`}
                    title={m.is_active ? "Deactivate" : "Activate"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteMessage(m.id)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="p-32 text-center glass rounded-[4rem] border-dashed border-white/5 opacity-30 flex flex-col items-center">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">No ticker messages found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTicker;
