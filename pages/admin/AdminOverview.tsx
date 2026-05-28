
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  PieChart, 
  ArrowUpRight, 
  Activity,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { PredictionResult, PaymentStatus } from '../../types';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPredictions: 0,
    wins: 0,
    losses: 0,
    freeWins: 0,
    freeTotal: 0,
    vipWins: 0,
    vipTotal: 0,
    vvipWins: 0,
    vvipTotal: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    loading: true
  });

  const [marketPerformanceData, setMarketPerformanceData] = useState<any[]>([]);
  const [revenueTrendData, setRevenueTrendData] = useState<any[]>([]);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      // Fetch counts and data needed for stats & charts
      const [
        { data: profileData },
        { data: predData },
        { data: paymentData }
      ] = await Promise.all([
        supabase.from('profiles').select('created_at'),
        supabase.from('predictions').select('result, category, date'),
        supabase.from('payment_requests').select('amount, status, date')
      ]);

      // Metrics
      const wins = predData?.filter(p => p.result === PredictionResult.WIN).length || 0;
      const losses = predData?.filter(p => p.result === PredictionResult.LOSS).length || 0;
      
      const freeTips = predData?.filter(p => p.category === 'FREE' && p.result !== PredictionResult.PENDING) || [];
      const vipTips = predData?.filter(p => p.category === 'VIP' && p.result !== PredictionResult.PENDING) || [];
      const vvipTips = predData?.filter(p => p.category === 'VVIP' && p.result !== PredictionResult.PENDING) || [];

      const freeWins = freeTips.filter(p => p.result === PredictionResult.WIN).length;
      const vipWins = vipTips.filter(p => p.result === PredictionResult.WIN).length;
      const vvipWins = vvipTips.filter(p => p.result === PredictionResult.WIN).length;

      const totalPreds = predData?.length || 0;
      const pendingPayments = paymentData?.filter(p => p.status === PaymentStatus.PENDING).length || 0;
      
      const totalRevenue = paymentData?.reduce((acc, p) => {
        if (p.status === PaymentStatus.APPROVED) {
          const numericPart = p.amount.split(' ')[1]?.replace(/,/g, '');
          return acc + (parseFloat(numericPart) || 0);
        }
        return acc;
      }, 0) || 0;

      // Chart Data Processing: Market Win Rates Over Time
      const predictionsByDate = (predData || []).reduce((acc: any, p) => {
        if (!p.date || p.result === PredictionResult.PENDING) return acc;
        const date = new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) acc[date] = { date, FREE: { w: 0, t: 0 }, VIP: { w: 0, t: 0 }, VVIP: { w: 0, t: 0 } };
        
        acc[date][p.category].t += 1;
        if (p.result === PredictionResult.WIN) acc[date][p.category].w += 1;
        
        return acc;
      }, {});

      const processedMarketData = Object.values(predictionsByDate)
        .map((day: any) => ({
          date: day.date,
          FREE: day.FREE.t > 0 ? Math.round((day.FREE.w / day.FREE.t) * 100) : 0,
          VIP: day.VIP.t > 0 ? Math.round((day.VIP.w / day.VIP.t) * 100) : 0,
          VVIP: day.VVIP.t > 0 ? Math.round((day.VVIP.w / day.VVIP.t) * 100) : 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-10); // Last 10 days

      // Chart Data Processing: Revenue Trends (Daily sums)
      const revenueByDate = (paymentData || [])
        .filter(p => p.status === PaymentStatus.APPROVED)
        .reduce((acc: any, p) => {
          const date = new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const numericPart = p.amount.split(' ')[1]?.replace(/,/g, '');
          const amount = parseFloat(numericPart) || 0;
          acc[date] = (acc[date] || 0) + amount;
          return acc;
        }, {});

      const processedRevenue = Object.entries(revenueByDate)
        .map(([date, amount]) => ({ date, amount }))
        .slice(-7); // Last 7 days

      setStats({
        totalUsers: profileData?.length || 0,
        totalPredictions: totalPreds,
        wins,
        losses,
        freeWins,
        freeTotal: freeTips.length,
        vipWins,
        vipTotal: vipTips.length,
        vvipWins,
        vvipTotal: vvipTips.length,
        totalRevenue,
        pendingPayments,
        loading: false
      });

      setMarketPerformanceData(processedMarketData);
      setRevenueTrendData(processedRevenue);
    } catch (err) {
      console.error("Stats fetch error:", err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const winRate = stats.totalPredictions > 0 
    ? Math.round(((stats.wins) / (stats.wins + stats.losses || 1)) * 100) 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-black italic" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'amount' ? `XAF ${entry.value.toLocaleString()}` : `${entry.value}% Accuracy`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (stats.loading) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white/5 rounded-[3rem]"></div>)}
        </div>
        <div className="h-96 bg-white/5 rounded-[4rem] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-white/5 group hover:border-[#00C853]/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-[#00C853]/10 rounded-2xl text-[#00C853]"><DollarSign className="w-6 h-6" /></div>
            <ArrowUpRight className="w-5 h-5 text-[#00C853] opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-4xl font-black italic tracking-tighter mb-1 uppercase">
            {stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Gross Revenue (Sync)</div>
        </div>

        <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-white/5 group hover:border-[#00C853]/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500"><Target className="w-6 h-6" /></div>
            <Activity className="w-5 h-5 text-blue-500 opacity-50" />
          </div>
          <div className="text-4xl font-black italic tracking-tighter mb-1 uppercase text-blue-500">
            {winRate}%
          </div>
          <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Historical Accuracy</div>
        </div>

        <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-white/5 group hover:border-[#00C853]/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500"><Users className="w-6 h-6" /></div>
          </div>
          <div className="text-4xl font-black italic tracking-tighter mb-1 uppercase text-purple-500">
            {stats.totalUsers}
          </div>
          <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Total User Nodes</div>
        </div>

        <div className="glass p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-white/5 group hover:border-[#00C853]/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><BarChart3 className="w-6 h-6" /></div>
          </div>
          <div className="text-4xl font-black italic tracking-tighter mb-1 uppercase text-orange-500">
            {stats.totalPredictions}
          </div>
          <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Expert Outputs</div>
        </div>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Market Win Rates Area Chart */}
        <div className="glass p-12 rounded-[4rem] bg-white dark:bg-black/40 border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Target className="w-5 h-5 text-[#00C853]" /> Market Win Rates
            </h3>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Last 10 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketPerformanceData}>
                <defs>
                  <linearGradient id="colorFree" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVvip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="FREE" stroke="#94a3b8" strokeWidth={3} fillOpacity={1} fill="url(#colorFree)" />
                <Area type="monotone" dataKey="VIP" stroke="#00C853" strokeWidth={3} fillOpacity={1} fill="url(#colorVip)" />
                <Area type="monotone" dataKey="VVIP" stroke="#FFD700" strokeWidth={3} fillOpacity={1} fill="url(#colorVvip)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-[9px] font-black uppercase text-gray-500">Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00C853]"></div>
              <span className="text-[9px] font-black uppercase text-gray-500">VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FFD700]"></div>
              <span className="text-[9px] font-black uppercase text-gray-500">VVIP</span>
            </div>
          </div>
        </div>

        {/* Revenue Trends Bar Chart */}
        <div className="glass p-12 rounded-[4rem] bg-white dark:bg-black/40 border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Capital Flow
            </h3>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Approved Payments</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0, 200, 83, 0.05)'}} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {revenueTrendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === revenueTrendData.length - 1 ? '#00C853' : 'rgba(0, 200, 83, 0.3)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visual Analytics Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass p-12 rounded-[4rem] bg-white dark:bg-black/40 border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <PieChart className="w-5 h-5 text-[#00C853]" /> Market Performance Breakdown
            </h3>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stats.wins + stats.losses} SETTLED TIPS</span>
          </div>

          <div className="space-y-6">
            {/* Free Market */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-gray-400">Free Market ({stats.freeWins}/{stats.freeTotal})</span>
                <span className="text-[11px] font-black text-slate-400">
                  {stats.freeTotal > 0 ? Math.round((stats.freeWins / stats.freeTotal) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 transition-all duration-1000" 
                  style={{ width: `${stats.freeTotal > 0 ? (stats.freeWins / stats.freeTotal) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* VIP Market */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-gray-400">VIP Market ({stats.vipWins}/{stats.vipTotal})</span>
                <span className="text-[11px] font-black text-[#00C853]">
                  {stats.vipTotal > 0 ? Math.round((stats.vipWins / stats.vipTotal) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00C853] shadow-[0_0_10px_#00C853] transition-all duration-1000" 
                  style={{ width: `${stats.vipTotal > 0 ? (stats.vipWins / stats.vipTotal) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* VVIP Market */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-gray-400">VVIP Market ({stats.vvipWins}/{stats.vvipTotal})</span>
                <span className="text-[11px] font-black text-[#FFD700]">
                  {stats.vvipTotal > 0 ? Math.round((stats.vvipWins / stats.vvipTotal) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FFD700] shadow-[0_0_10px_#FFD700] transition-all duration-1000" 
                  style={{ width: `${stats.vvipTotal > 0 ? (stats.vvipWins / stats.vvipTotal) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-white">Overall Accuracy</span>
                <span className="text-[11px] font-black text-[#00C853]">{winRate}%</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-[#00C853] transition-all duration-1000" 
                  style={{ width: `${winRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-12 rounded-[4rem] bg-white dark:bg-black/40 border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-500" /> Infrastructure Node
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-white/5 text-center">
              <div className="text-3xl font-black italic text-white mb-1 uppercase">{stats.pendingPayments}</div>
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pending Verification</div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-white/5 text-center">
              <div className="text-3xl font-black italic text-[#00C853] mb-1 uppercase">99.9%</div>
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Cloud Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;