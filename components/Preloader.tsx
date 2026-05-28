
import React from 'react';
import { Trophy, ShieldCheck, Activity, Cpu } from 'lucide-react';

interface PreloaderProps {
  logo?: string;
  isReady?: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ logo, isReady }) => {
  const logoUrl = "https://i.ibb.co/b833KVf/logo-no-bg.png";

  return (
    <div className={`fixed inset-0 bg-dark-bg z-[9999] flex flex-col items-center justify-center transition-all duration-1000 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        {/* Animated Scanning Line */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-20 w-full animate-[scan_3s_ease-in-out_infinite]"></div>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Sophisticated Orbital Rings */}
        <div className="absolute w-80 h-80 border border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute w-[320px] h-[320px] border border-dashed border-primary/30 rounded-full animate-[spin_15s_linear_infinite_reverse]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_#0099ff]"></div>
        </div>
        <div className="absolute w-[450px] h-[450px] border border-primary/10 rounded-full animate-[spin_25s_linear_infinite]"></div>
        
        {/* Core Glow */}
        <div className="absolute w-40 h-40 bg-primary blur-[80px] opacity-20 animate-pulse"></div>
        
        {/* Central Logo Container */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative p-8">
             <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse"></div>
             {logo || logoUrl ? (
                <img 
                  src={logo || logoUrl} 
                  alt="BettaBets" 
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_35px_rgba(0,153,255,0.5)] relative z-10" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
              ) : null}
          </div>
        </div>
      </div>
      
      <div className="mt-20 text-center space-y-8 max-w-sm relative z-20">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white flex items-center justify-center gap-1">
            BETTA<span className="text-primary text-glow">BETS</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Activity className="w-3.5 h-3.5 text-primary animate-bounce" />
            <p className="text-[9px] font-black tracking-[0.5em] uppercase opacity-60">EXPERT SOCCER ANALYSIS</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-4 px-8">
           <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
                 <span>LOADING MATCH DATA</span>
                 <span className="text-primary">OPTIMAL</span>
              </div>
              <div className="w-full h-[1px] bg-white/10 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent w-1/3 animate-[loading_1.5s_infinite]"></div>
              </div>
           </div>

           <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1.5">
                 <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_#0099ff]"></div>
                 <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">SECURE CONNECTION</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_#0099ff]"></div>
                 <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">LIVE MATCH ODDS</span>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes scan {
          0% { transform: translateY(-100vh); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Preloader;
