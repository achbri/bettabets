
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, CheckCircle, XCircle, Trash2, Clock, Check, X, Target, Database, Copy, ChevronDown, ChevronUp, Calendar, ArrowUpDown, Filter } from 'lucide-react';
import { Prediction, PredictionCategory, PredictionResult } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

type SortField = 'date' | 'league' | 'odds';
type SortOrder = 'asc' | 'desc';

const AdminPredictions: React.FC = () => {
  const { showToast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [newPred, setNewPred] = useState<Partial<Prediction>>({ 
    league: '', match: '', tip: '', odds: '', category: PredictionCategory.FREE, kickoffTime: '15:00', date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<{ message: string; code?: string } | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Settlement state
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState('');

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('predictions').select('*').order('date', { ascending: false });
      if (error) {
        setErrorStatus({ message: error.message, code: error.code });
      } else if (data) {
        setPredictions(data as Prediction[]);
        setErrorStatus(null);
        if (viewMode === 'grouped') {
          const dates = [...new Set((data as Prediction[]).map(p => p.date))].sort().reverse();
          if (dates.length > 0) setExpandedDates({ [dates[0] as string]: true });
        }
      }
    } catch (err: any) {
      setErrorStatus({ message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const updatePredResult = async (id: string, result: PredictionResult) => {
    try {
      const scoreToUpdate = finalScore.trim() || 'FT';
      const { error } = await supabase
        .from('predictions')
        .update({ result: result, score: scoreToUpdate })
        .eq('id', id);

      if (error) throw error;
      showToast(`Settled as ${result} (${scoreToUpdate})`, result === PredictionResult.WIN ? "success" : "error");
      setSettlingId(null);
      setFinalScore('');
      fetchPredictions();
    } catch (err: any) {
      showToast("Settlement failed: " + err.message, "error");
    }
  };

  const handleAddPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('predictions').insert([{ ...newPred, result: PredictionResult.PENDING }]);
    if (!error) {
      showToast("Prediction published!", "success");
      fetchPredictions();
      setNewPred({ league: '', match: '', tip: '', odds: '', category: PredictionCategory.FREE, kickoffTime: '15:00', date: new Date().toISOString().split('T')[0] });
    } else {
      showToast("Error publishing: " + error.message, "error");
    }
  };

  const deletePrediction = async (id: string) => {
    if (!confirm("Permanently delete?")) return;
    const { error } = await supabase.from('predictions').delete().eq('id', id);
    if (!error) {
      showToast("Deleted", "info");
      fetchPredictions();
    }
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedPredictions = useMemo(() => {
    return [...predictions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
        if (comparison === 0) comparison = a.kickoffTime.localeCompare(b.kickoffTime);
      } else if (sortField === 'league') {
        comparison = a.league.localeCompare(b.league);
      } else if (sortField === 'odds') {
        comparison = parseFloat(a.odds) - parseFloat(b.odds);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [predictions, sortField, sortOrder]);

  const groupedTips = useMemo(() => {
    if (viewMode === 'flat') return {};
    return sortedPredictions.reduce((acc, p) => {
      if (!acc[p.date]) acc[p.date] = [];
      acc[p.date].push(p);
      return acc;
    }, {} as Record<string, Prediction[]>);
  }, [sortedPredictions, viewMode]);

  const sortedDates = Object.keys(groupedTips).sort((a, b) => b.localeCompare(a));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4">
        <form onSubmit={handleAddPrediction} className="glass p-8 rounded-[2.5rem] sticky top-24 space-y-5 bg-white dark:bg-black/60 shadow-xl border-white/5">
          <h2 className="text-xl font-black italic uppercase text-[#00C853]">New Tip</h2>
          <div className="space-y-3">
            <input type="date" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold" value={newPred.date} onChange={e => setNewPred({...newPred, date: e.target.value})} required />
            <input type="text" placeholder="League" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold" value={newPred.league} onChange={e => setNewPred({...newPred, league: e.target.value})} required />
            <input type="text" placeholder="Match" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold" value={newPred.match} onChange={e => setNewPred({...newPred, match: e.target.value})} required />
            <input type="text" placeholder="Tip" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold" value={newPred.tip} onChange={e => setNewPred({...newPred, tip: e.target.value})} required />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Odds" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold" value={newPred.odds} onChange={e => setNewPred({...newPred, odds: e.target.value})} required />
              <input type="time" className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold" value={newPred.kickoffTime} onChange={e => setNewPred({...newPred, kickoffTime: e.target.value})} required />
            </div>
            <select className="w-full bg-slate-100 dark:bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-black uppercase appearance-none" value={newPred.category} onChange={e => setNewPred({...newPred, category: e.target.value as any})}>
              <option value={PredictionCategory.FREE}>FREE TIP</option>
              <option value={PredictionCategory.VIP}>VIP SELECTION</option>
              <option value={PredictionCategory.VVIP}>VVIP ELITE</option>
              <option value={PredictionCategory.SUREST}>SUREST WIN</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-[#00C853] text-black py-4 rounded-xl font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-[#00C853]/20">Publish To Board</button>
        </form>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Live Board</h2>
          
          {/* Sorting and View Controls */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-white/5">
            <button onClick={() => setViewMode('grouped')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'grouped' ? 'bg-[#00C853] text-black shadow-md' : 'text-gray-500 hover:text-white'}`}>Grouped</button>
            <button onClick={() => setViewMode('flat')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'flat' ? 'bg-[#00C853] text-black shadow-md' : 'text-gray-500 hover:text-white'}`}>Flat List</button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => handleSort('date')} className={`p-2 rounded-xl transition-all ${sortField === 'date' ? 'text-[#00C853]' : 'text-gray-500'}`} title="Sort by Date"><Calendar className="w-4 h-4" /></button>
            <button onClick={() => handleSort('league')} className={`p-2 rounded-xl transition-all ${sortField === 'league' ? 'text-[#00C853]' : 'text-gray-500'}`} title="Sort by League"><Filter className="w-4 h-4" /></button>
            <button onClick={() => handleSort('odds')} className={`p-2 rounded-xl transition-all ${sortField === 'odds' ? 'text-[#00C853]' : 'text-gray-500'}`} title="Sort by Odds"><TrendingUp className="w-4 h-4" /></button>
          </div>
        </div>

        {loading && predictions.length === 0 ? (
          <div className="animate-pulse space-y-4"><div className="h-20 bg-white/5 rounded-3xl"></div><div className="h-20 bg-white/5 rounded-3xl"></div></div>
        ) : (
          <div className="space-y-4">
            {viewMode === 'flat' ? (
              <div className="space-y-3 animate-in fade-in duration-300">
                {sortedPredictions.map(p => (
                  <PredictionRow key={p.id} p={p} settlingId={settlingId} setSettlingId={setSettlingId} finalScore={finalScore} setFinalScore={setFinalScore} deletePrediction={deletePrediction} updatePredResult={updatePredResult} />
                ))}
              </div>
            ) : (
              sortedDates.map(dateString => {
                const isOpen = expandedDates[dateString];
                const tips = groupedTips[dateString];
                const isToday = dateString === new Date().toISOString().split('T')[0];

                return (
                  <div key={dateString} className="border border-white/5 rounded-3xl overflow-hidden bg-white/5">
                    <button onClick={() => toggleDate(dateString)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <Calendar className={`w-5 h-5 ${isToday ? 'text-[#00C853]' : 'text-gray-500'}`} />
                        <div className="text-left">
                          <div className="font-black italic uppercase text-sm tracking-widest">{isToday ? 'Today — ' : ''}{new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{tips.length} Active Tips</div>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>

                    {isOpen && (
                      <div className="p-6 pt-0 space-y-4">
                        {tips.map(p => (
                          <PredictionRow key={p.id} p={p} settlingId={settlingId} setSettlingId={setSettlingId} finalScore={finalScore} setFinalScore={setFinalScore} deletePrediction={deletePrediction} updatePredResult={updatePredResult} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface PredictionRowProps {
  p: Prediction;
  settlingId: string | null;
  setSettlingId: (id: string | null) => void;
  finalScore: string;
  setFinalScore: (score: string) => void;
  deletePrediction: (id: string) => void;
  updatePredResult: (id: string, res: PredictionResult) => void;
}

const PredictionRow: React.FC<PredictionRowProps> = ({ p, settlingId, setSettlingId, finalScore, setFinalScore, deletePrediction, updatePredResult }) => {
  const isSettled = p.result !== PredictionResult.PENDING;
  const isSettling = settlingId === p.id;
  
  return (
    <div className={`p-6 rounded-2xl border transition-all ${isSettled ? 'bg-white/5 border-white/5 opacity-40' : 'bg-black/20 border-white/10'}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-black uppercase text-gray-500">{p.league} • {p.kickoffTime}</span>
            <span className={`text-[7px] px-2 py-0.5 rounded font-black border ${
              p.category === PredictionCategory.FREE ? 'text-blue-500 border-blue-500/20' : 
              p.category === PredictionCategory.SUREST ? 'text-[#D5D04A] border-[#D5D04A]/20' : 
              p.category === PredictionCategory.VVIP ? 'text-[#FFD700] border-[#FFD700]/20' : 
              'text-[#00C853] border-[#00C853]/20'
            }`}>{p.category}</span>
          </div>
          <h4 className="font-black italic uppercase text-md">{p.match} <span className="text-[#00C853]">→ {p.tip}</span></h4>
          {isSettled && <div className="text-[9px] font-black uppercase text-[#00C853] mt-1">{p.result} {p.score ? `(${p.score})` : ''}</div>}
        </div>
        <div className="flex gap-2">
          <div className="bg-white/5 px-3 py-1 rounded-lg flex items-center gap-1 border border-white/5 mr-2">
            <span className="text-[8px] text-gray-500 font-bold uppercase">Odds</span>
            <span className="text-xs font-black">{p.odds}</span>
          </div>
          {!isSettled && !isSettling && (
            <button onClick={() => setSettlingId(p.id)} className="bg-[#00C853] text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase italic">Settle</button>
          )}
          <button onClick={() => deletePrediction(p.id)} className="p-3 text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-4.5 h-4.5" /></button>
        </div>
      </div>
      {isSettling && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-3 animate-in slide-in-from-top-2">
          <input 
            type="text" 
            placeholder="Score (e.g. 2-1)" 
            className="flex-1 min-w-[120px] bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:border-[#00C853]/50" 
            value={finalScore} 
            onChange={e => setFinalScore(e.target.value)} 
          />
          <div className="flex gap-2">
            <button onClick={() => updatePredResult(p.id, PredictionResult.WIN)} className="bg-[#00C853] text-black px-6 py-2 rounded-xl font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Check className="w-4 h-4" /> Win</button>
            <button onClick={() => updatePredResult(p.id, PredictionResult.LOSS)} className="bg-red-500 text-white px-6 py-2 rounded-xl font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><X className="w-4 h-4" /> Loss</button>
            <button onClick={() => { setSettlingId(null); setFinalScore(''); }} className="text-gray-500 px-4 text-[10px] font-black uppercase">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPredictions;
