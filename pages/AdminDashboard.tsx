
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
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      if (isMounted) {
        await fetchNotificationCounts();
        timeoutId = setTimeout(poll, 30000);
      }
    };

    poll();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-12 py-12">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Admin <span className="text-primary">Desk</span>
          </h1>
          <p className="text-gray-500 font-medium text-xs">Platform Management Control</p>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map(item => (
            <NavLink 
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                {React.createElement(item.icon as any, { className: "w-4 h-4" })}
                {item.label}
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-black/20 border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[500px]">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="animate-in fade-in duration-300 relative z-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;