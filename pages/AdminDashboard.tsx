
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  Users, CreditCard, TrendingUp, Settings, 
  MessageSquare, Ticket, ShieldCheck, DollarSign, Star, Clock, LayoutDashboard, Megaphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PaymentStatus } from '../types';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [pendingSupportCount, setPendingSupportCount] = useState(0);

  const fetchNotificationCounts = async () => {
    try {
      // Fetch pending payments
      const { count: payCount } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', PaymentStatus.PENDING);
      
      // Fetch unreplied support tickets
      const { count: supportCount } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .is('adminReply', null);

      setPendingPaymentsCount(payCount || 0);
      setPendingSupportCount(supportCount || 0);
    } catch (err) {
      console.warn("Failed to fetch notification counts");
    }
  };

  useEffect(() => {
    fetchNotificationCounts();
    // Poll every 30 seconds for new updates
    const interval = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const navItems = [
    { to: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { to: 'payments', icon: CreditCard, label: 'Payments', badge: pendingPaymentsCount },
    { to: 'predictions', icon: TrendingUp, label: 'Predictions' },
    { to: 'ticker', icon: Megaphone, label: 'Ticker' },
    { to: 'pricing', icon: DollarSign, label: 'Pricing' },
    { to: 'reviews', icon: Star, label: 'Reviews' },
    { to: 'users', icon: Users, label: 'Users' },
    { to: 'messages', icon: MessageSquare, label: 'Support', badge: pendingSupportCount },
    { to: 'coupons', icon: Ticket, label: 'Coupons' },
    { to: 'system', icon: Settings, label: 'System' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in duration-500">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-3">
            ADMIN <span className="text-[#00C853]">DESK</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Cloud Infrastructure Control</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 p-4 rounded-3xl border border-slate-200 dark:border-white/10">
          <Clock className="w-5 h-5 text-[#00C853]" />
          <span className="text-[11px] font-black uppercase tracking-widest">{new Date().toLocaleTimeString()} • SYSTEM STABLE</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-10 bg-slate-100 dark:bg-white/5 p-2 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-x-auto custom-scrollbar shadow-inner">
        {navItems.map(item => (
          <NavLink 
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap relative ${isActive ? 'bg-[#00C853] text-black shadow-lg shadow-[#00C853]/30 scale-105' : 'text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}
          >
            {React.createElement(item.icon as any, { className: "w-4 h-4" })}
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] animate-bounce">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;