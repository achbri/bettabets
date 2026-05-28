
import React, { useState, useEffect } from 'react';
// Fix: Import Link component from react-router-dom
import { Link } from 'react-router-dom';
import { User, Prediction, PredictionCategory, SubscriptionType } from '../types';
import { Crown, Star, Clock, AlertTriangle, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { useAuth } from '../lib/AuthContext';

const VIPSection: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const fetchVIP = async () => {
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .neq('category', PredictionCategory.FREE)
        .order('date', { ascending: false });
      if (data) setPredictions(data);
    };
    fetchVIP();
  }, []);

  const vipTips = predictions.filter(p => p.category === PredictionCategory.VIP);
  const vvipTips = predictions.filter(p => p.category === PredictionCategory.VVIP);

  const totalOdds = vipTips.reduce((acc, p) => acc * parseFloat(p.odds), 1).toFixed(2);
  const vvipTotalOdds = vvipTips.reduce((acc, p) => acc * parseFloat(p.odds), 1).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
            VIP <span className="text-[#00C853]">Exclusive</span> Area
          </h1>
          <p className="text-gray-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00C853]" />
            Cloud-verified Premium Selections
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="bg-[#00C853]/10 border border-[#00C853]/30 px-6 py-4 rounded-3xl flex items-center gap-4">
            <Crown className="w-8 h-8 text-[#00C853]" />
            <div className="font-black italic text-sm">{user.subscription} ACCESS</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase flex items-center gap-3">Daily 2+ VIP</h2>
          <div className="space-y-4">
            {vipTips.map((tip) => (
              <div key={tip.id} className="glass p-6 rounded-[2rem] border-white/5">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase text-[#00C853]">{tip.league}</span>
                    <span className="text-[10px] text-gray-500">{tip.kickoffTime}</span>
                </div>
                <h4 className="text-xl font-black mb-2">{tip.match}</h4>
                <div className="flex justify-between font-black">
                    <span className="text-[#00C853]">{tip.tip}</span>
                    <span>{tip.odds}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase flex items-center gap-3 text-[#FFD700]">VVIP+ Special</h2>
          {user.subscription === SubscriptionType.VVIP ? (
            <div className="space-y-4">
                {vvipTips.map((tip) => (
                    <div key={tip.id} className="glass p-6 rounded-[2rem] border-[#FFD700]/20">
                         <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black uppercase text-[#FFD700]">{tip.league}</span>
                        </div>
                        <h4 className="text-xl font-black text-white">{tip.match}</h4>
                        <div className="flex justify-between font-black">
                            <span className="text-[#FFD700]">{tip.tip}</span>
                            <span>{tip.odds}</span>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="glass p-12 rounded-[2.5rem] border-[#FFD700]/10 text-center space-y-6">
              <Star className="w-12 h-12 text-[#FFD700]/20 mx-auto" />
              <h3 className="text-xl font-black italic uppercase">Upgrade to VVIP+</h3>
              <p className="text-gray-500 text-sm">Unlock exclusive rollover series and high-stake tickets.</p>
              <Link to="/payment" className="inline-block w-full py-4 bg-[#FFD700] text-black font-black uppercase italic rounded-2xl">Upgrade Now</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VIPSection;
