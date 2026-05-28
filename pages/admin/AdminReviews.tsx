
import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, User as UserIcon, Database, Check, Copy } from 'lucide-react';
import { Testimonial } from '../../types';
import { supabase } from '../../lib/supabase';

const AdminReviews: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const SQL_FIX = `CREATE TABLE testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  profile_pic TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Allow Public to View Approved Testimonials
CREATE POLICY "Public can view approved testimonials" 
ON testimonials FOR SELECT 
USING (is_approved = true);

-- Allow Authenticated to insert their own
CREATE POLICY "Users can submit testimonials" 
ON testimonials FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access on testimonials" 
ON testimonials FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
));`;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) {
      setErrorStatus({ message: error.message, code: error.code });
    } else if (data) {
      setTestimonials(data);
      setErrorStatus(null);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from('testimonials').update({ is_approved: !current }).eq('id', id);
    if (!error) {
      alert(`Success: Review ${!current ? 'Approved' : 'Hidden'}!`);
      fetchReviews();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_FIX);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (errorStatus?.code === '42P01' || errorStatus?.message.includes('relation "public.testimonials" does not exist')) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass p-12 rounded-[4rem] border-red-500/20 bg-red-500/5 text-center space-y-8">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500"><Database className="w-12 h-12" /></div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-red-500">Reviews Table Missing</h2>
            <p className="text-gray-400 font-black uppercase text-[11px] tracking-[0.2em] max-w-lg mx-auto leading-loose">
              The <code className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">testimonials</code> table is missing. Run this SQL to fix it:
            </p>
          </div>
          <div className="relative group">
            <pre className="bg-black/60 p-8 rounded-[2rem] text-left text-[10px] font-mono text-blue-400 overflow-x-auto border border-white/5 scrollbar-hide">{SQL_FIX}</pre>
            <button onClick={copySql} className="absolute top-4 right-4 bg-white/10 p-3 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase">
              {copied ? <Check className="w-4 h-4 text-[#00C853]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy SQL'}
            </button>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase italic tracking-[0.3em] text-[11px]">Reload Platform</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Testimonial Moderation</h2>
      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 rounded-[3rem]"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.id} className={`glass p-10 rounded-[4rem] border transition-all ${t.is_approved ? 'border-[#00C853]/20 bg-[#00C853]/5' : 'bg-white dark:bg-black/40 border-white/5'}`}>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-3xl overflow-hidden border-2 border-white/10 bg-black flex items-center justify-center">
                  {t.profile_pic ? <img src={t.profile_pic} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-gray-700" />}
                </div>
                <div>
                  <div className="font-black italic uppercase tracking-tighter">{t.username}</div>
                  <div className="flex text-[#FFD700]">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-current' : 'opacity-20'}`} />)}
                  </div>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm italic font-medium mb-10 line-clamp-3 leading-relaxed">"{t.content}"</p>
              <button 
                onClick={() => handleToggle(t.id, t.is_approved)}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${t.is_approved ? 'bg-orange-500/10 text-orange-500' : 'bg-[#00C853] text-black'}`}
              >
                {t.is_approved ? <ThumbsDown className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />}
                {t.is_approved ? 'HIDE' : 'APPROVE'}
              </button>
            </div>
          ))}
          {testimonials.length === 0 && <div className="col-span-full p-20 text-center opacity-30 italic">No reviews yet</div>}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
