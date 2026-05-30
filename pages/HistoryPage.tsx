import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Prediction, PredictionResult, PredictionCategory, AppConfig } from '../types';
import { 
  ChevronDown, 
  ChevronUp,
  Trophy, 
  Crown, 
  Star, 
  ShieldCheck, 
  History,
  TrendingUp,
  Clock,
  Download,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { INITIAL_PREDICTIONS } from '../constants';
import { toPng } from 'html-to-image';
import { useToast } from '../components/Toast';

interface HistoryPageProps {
  config: AppConfig;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ config }) => {
  const { showToast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('id, league, match, tip, odds, result, date, score, category')
          .neq('result', PredictionResult.PENDING)
          .order('date', { ascending: false });
        
        let serverPredictions = data ? (data as Prediction[]) : [];
        const merged = [...serverPredictions];
        
        INITIAL_PREDICTIONS.forEach(seed => {
          const exists = merged.some(p => p.id === seed.id || (p.match === seed.match && p.date === seed.date));
          if (!exists) merged.push(seed);
        });

        setPredictions(merged);
        
        // Auto-expand the most recent date
        const dates = [...new Set(merged.map(p => p.date))].sort().reverse();
        if (dates.length > 0) {
          // Fix: Cast the computed property key to string to resolve potential TS error
          setExpandedDates({ [dates[0] as string]: true });
        }
      } catch (err) {
        setPredictions(INITIAL_PREDICTIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleDownloadDay = async (dateString: string) => {
    const element = dayRefs.current[dateString];
    if (!element) return;
    
    setIsDownloading(dateString);
    showToast(`Capturing records for ${dateString}...`, "info");
    
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
        skipFonts: true,
        fontEmbedCSS: '',
        style: {
          borderRadius: '0'
        }
      });
      
      const link = document.createElement('a');
      link.download = `BettaBets-Vault-${dateString}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Day records saved!", "success");
    } catch (err) {
      console.error("Download failed:", err);
      showToast("Failed to save records.", "error");
    } finally {
      setIsDownloading(null);
    }
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const groupedByDate = useMemo(() => {
    return predictions.reduce((acc, p) => {
      const date = p.date;
      if (!acc[date]) {
        acc[date] = {
          [PredictionCategory.SUREST]: [],
          [PredictionCategory.FREE]: [],
          [PredictionCategory.VIP]: [],
          [PredictionCategory.VVIP]: []
        };
      }
      acc[date][p.category].push(p);
      return acc;
    }, {} as Record<string, Record<PredictionCategory, Prediction[]>>);
  }, [predictions]);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center">
        <div className="w-12 h-12 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Syncing Vault Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="text-center mb-16 relative">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-4">The <span className="text-[#00C853]">Vault</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Chronological Performance Ledger</p>
      </div>

      <div className="space-y-8">
        {sortedDates.map((dateString) => {
          const isOpen = expandedDates[dateString];
          const categories = groupedByDate[dateString];
          
          // Calculate stats for the day
          const allTips = (Object.values(categories) as Prediction[][]).flat();
          const wins = allTips.filter(t => t.result === PredictionResult.WIN).length;

          return (
            <div key={dateString} className="group border border-white/5 rounded-[2.5rem] overflow-hidden bg-white/5 transition-all">
              <div className="flex items-center justify-between p-6 bg-white/5 border-b border-white/5">
                <button 
                  onClick={() => toggleDate(dateString)}
                  className="flex items-center gap-4 text-left"
                >
                  <div className={`p-2 rounded-lg ${dateString === '2026-02-08' ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'bg-[#00C853]/10 text-[#00C853]'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black italic uppercase tracking-tighter">
                      {new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {allTips.length} Analyzed • {wins} Success
                    </div>
                  </div>
                </button>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDownloadDay(dateString)}
                    disabled={isDownloading === dateString}
                    className="bg-white/5 p-2.5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors text-[#00C853]"
                    title="Download Day Records"
                  >
                    {isDownloading === dateString ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleDate(dateString)} className="p-2.5 text-gray-500">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div 
                  ref={el => dayRefs.current[dateString] = el}
                  className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300 relative bg-[#0a0a0a]"
                >
                  <div className="relative z-10 space-y-10">
                    {[PredictionCategory.SUREST, PredictionCategory.FREE, PredictionCategory.VIP, PredictionCategory.VVIP].map((cat) => {
                      const tips = categories[cat];
                      if (!tips || tips.length === 0) return null;

                      const totalOdds = tips.reduce((sum, p) => sum * Number(p.odds), 1).toFixed(2);

                      return (
                        <div key={cat} className="space-y-6">
                          <div className={`flex items-center justify-between px-6 py-4 rounded-2xl ${
                            cat === PredictionCategory.SUREST ? 'bg-[#D5D04A] text-black' :
                            cat === PredictionCategory.VVIP ? 'bg-[#FFD700] text-black' :
                            cat === PredictionCategory.VIP ? 'bg-[#00C853] text-black' :
                            'bg-blue-500 text-white'
                          }`}>
                            <div className="text-[11px] font-black uppercase tracking-[0.2em]">
                              {cat} MARKET
                            </div>
                            <div className="text-[11px] font-black uppercase tracking-widest">
                              TOTAL ODDS: {totalOdds}
                            </div>
                          </div>

                          <div className="grid gap-4">
                            {tips.map((tip) => (
                              <div key={tip.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0c0c0c] rounded-3xl border border-white/5 gap-6">
                                <div className="flex-1">
                                  <div className="text-[10px] font-black uppercase text-[#00C853] mb-1.5 tracking-wider">{tip.league}</div>
                                  <h4 className="font-black uppercase italic text-lg text-white mb-1.5 tracking-tight">{tip.match}</h4>
                                  <div className="text-[11px] font-bold text-gray-500">Pick: <span className="text-white">{tip.tip}</span> @ {tip.odds}</div>
                                </div>
                                <div className="flex items-center gap-5 justify-between md:justify-end">
                                  <div className="bg-[#151515] px-6 py-3 rounded-2xl text-center border border-white/5 min-w-[100px]">
                                    <div className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-tighter">FT Score</div>
                                    <div className="text-sm font-mono font-black text-[#00C853]">{tip.score || 'N/A'}</div>
                                  </div>
                                  <div className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] min-w-[100px] text-center ${
                                    tip.result === PredictionResult.WIN ? 'bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                  }`}>
                                    {tip.result}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sortedDates.length === 0 && (
          <div className="p-20 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
            <History className="w-12 h-12 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No entries in the vault</p>
          </div>
        )}
      </div>

      <div className="mt-24 p-10 bg-[#00C853]/5 border border-[#00C853]/10 rounded-[3rem] text-center">
        <TrendingUp className="w-8 h-8 text-[#00C853] mx-auto mb-4 opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 opacity-60">
          Transparency verified by independent audit. Verified historical records since Feb 8, 2026.
        </p>
      </div>
    </div>
  );
};

export default HistoryPage;
