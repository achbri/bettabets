
import React, { useState, useEffect } from 'react';
import { Send, ShieldCheck, User as UserIcon, Trash2, Reply, Loader2, Sparkles } from 'lucide-react';
import { SupportMessage } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

const AdminMessages: React.FC = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('date', { ascending: false });
    
    if (data) setMessages(data as SupportMessage[]);
    setLoading(false);
  };

  const handleReply = async (id: string) => {
    const text = replies[id];
    if (!text?.trim()) return;

    const { error } = await supabase
      .from('support_messages')
      .update({ 
        adminReply: text, 
        replyDate: new Date().toISOString() 
      })
      .eq('id', id);

    if (!error) { 
      showToast("Reply dispatched!", "success"); 
      setReplies({ ...replies, [id]: '' }); 
      fetchMessages(); 
    } else {
      showToast("Failed to reply: " + error.message, "error");
    }
  };

  const [generatingReplyFor, setGeneratingReplyFor] = useState<string | null>(null);

  const handleGenerateReply = async (id: string, content: string) => {
    setGeneratingReplyFor(id);
    try {
      const response = await fetch('/api/ai/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: `A user sent this support message: "${content}". Write a brief, helpful, professional reply as the BettaBets support team.` }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(typeof data.error === 'object' ? data.error.message || JSON.stringify(data.error) : data.error);
      const generatedText = data.choices?.[0]?.message?.content?.trim();
      if (generatedText) {
        setReplies(prev => ({ ...prev, [id]: generatedText }));
      }
    } catch (err: any) {
      showToast("AI Failed: " + err.message, "error");
    } finally {
      setGeneratingReplyFor(null);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Delete this support ticket?")) return;
    const { error } = await supabase.from('support_messages').delete().eq('id', id);
    if (!error) {
      showToast("Ticket deleted.", "info");
      fetchMessages();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Support Inbox</h2>

      {loading ? (
        <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#00C853]" /></div>
      ) : (
        messages.map(m => (
          <div key={m.id} className="glass p-10 rounded-[3rem] space-y-6 bg-white dark:bg-black/60 border-white/5 relative group">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00C853]/10 flex items-center justify-center font-black text-[#00C853] uppercase border border-[#00C853]/20">
                  {m.username.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl uppercase italic">{m.username}</span>
                    {!m.adminReply && <div className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse"></div>}
                  </div>
                  <div className="text-[9px] text-gray-500 font-black tracking-widest">{new Date(m.date).toLocaleString()}</div>
                </div>
              </div>
              <button onClick={() => handleDeleteMessage(m.id)} className="p-3 text-red-500/40 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-2xl border border-white/5 italic text-gray-400">
              "{m.content}"
            </div>

            {m.adminReply ? (
              <div className="bg-[#00C853]/10 p-6 rounded-2xl border border-[#00C853]/20 italic text-[#00C853]">
                <div className="text-[9px] font-black uppercase mb-2 flex items-center gap-2"><Reply className="w-3 h-3" /> Sent Official Response</div>
                <p className="text-sm font-bold">{m.adminReply}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Type official reply..." 
                    value={replies[m.id] || ''} 
                    onChange={e => setReplies({...replies, [m.id]: e.target.value})} 
                    className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00C853]/50 text-sm" 
                  />
                  <button onClick={() => handleReply(m.id)} className="bg-[#00C853] text-black px-8 rounded-xl font-black uppercase italic text-[10px] flex items-center justify-center"><Send className="w-4 h-4 ml-2" /> Send</button>
                </div>
                <button 
                  onClick={() => handleGenerateReply(m.id, m.content)} 
                  disabled={generatingReplyFor === m.id}
                  className="flex items-center gap-2 text-[10px] font-black uppercase italic text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all disabled:opacity-50 w-fit"
                >
                  {generatingReplyFor === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Generate AI Reply
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AdminMessages;
