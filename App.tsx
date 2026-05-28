
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  LogOut, 
  ShieldCheck,
  Menu,
  X,
  User as UserIcon,
  Crown,
  LayoutDashboard
} from 'lucide-react';
import { UserRole, SubscriptionType, AppConfig } from './types';
import { DEFAULT_APP_CONFIG } from './constants';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPredictions from './pages/admin/AdminPredictions';
import AdminPricing from './pages/admin/AdminPricing';
import AdminReviews from './pages/admin/AdminReviews';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMessages from './pages/admin/AdminMessages';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSystem from './pages/admin/AdminSystem';
import AdminTicker from './pages/admin/AdminTicker';
import VIPSection from './pages/VIPSection';
import PaymentPage from './pages/PaymentPage';
import HistoryPage from './pages/HistoryPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppLayout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (data) {
          setConfig(data as AppConfig);
        }
      } catch (err: any) {
        console.error("Config fetch error", err);
      }
    };

    initData();
  }, []);

  const BrandIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
    <div className={`transition-all duration-500 flex items-center justify-center group-hover:scale-110 ${className}`}>
      {config.logo ? (
        <img 
          src={config.logo} 
          alt="Logo" 
          className="w-full h-full object-contain filter drop-shadow-[0_5px_15px_rgba(0,153,255,0.3)]" 
          referrerPolicy="no-referrer" 
        />
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <ScrollToTop />

      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,153,255,0.05),transparent_60%)]"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      </div>
      
      <nav className="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-2xl border-b border-white/5 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-4 group relative">
            <BrandIcon className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none text-white">
                Betta<span className="text-primary">Bets</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium mt-1">Soccer Analytics Platform</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-semibold text-gray-300 hover:text-white transition-all">Home</Link>
            <Link to="/history" className="text-sm font-semibold text-gray-300 hover:text-white transition-all">History</Link>
            {user ? (
              <div className="flex items-center space-x-4 ml-2 pl-4 border-l border-white/10">
                <Link to="/dashboard" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all border border-white/10">
                  <LayoutDashboard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold">{user.username}</span>
                </Link>
                {user.role === UserRole.ADMIN && (
                   <Link to="/admin" className="text-sm font-semibold text-primary">Admin</Link>
                )}
                <button onClick={signOut} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-all">Sign In</Link>
                <Link to="/register" className="btn-primary py-2 px-5 text-sm">Get Premium</Link>
              </div>
            )}
          </div>

          <button className="md:hidden p-3 text-gray-300 bg-white/5 rounded-2xl border border-white/5" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

            <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-x-0 top-20 bg-dark-bg/95 backdrop-blur-3xl border-b border-white/5 p-8 flex flex-col space-y-6 z-40 md:hidden h-[calc(100vh-5rem)]"
            >
              <Link to="/" className="text-2xl font-bold hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/history" className="text-2xl font-bold hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>History</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-2xl font-bold hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  {user.role === UserRole.ADMIN && <Link to="/admin" className="text-2xl font-bold text-primary" onClick={() => setIsMenuOpen(false)}>Admin</Link>}
                  <button onClick={signOut} className="text-left text-2xl font-bold text-red-500">Log Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  <Link to="/register" className="text-2xl font-bold text-primary" onClick={() => setIsMenuOpen(false)}>Get Premium</Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={useLocation().pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/history" element={<HistoryPage config={config} />} />
          <Route path="/dashboard" element={user ? <UserDashboard config={config} /> : <Navigate to="/login" />} />
          <Route path="/vip" element={user && user.subscription !== SubscriptionType.FREE ? <VIPSection /> : <Navigate to="/dashboard" />} />
          <Route path="/payment" element={user ? <PaymentPage /> : <Navigate to="/login" />} />
          
          <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="predictions" element={<AdminPredictions />} />
            <Route path="ticker" element={<AdminTicker />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="system" element={<AdminSystem />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  </main>
      
      <footer className="bg-dark-bg border-t border-white/5 py-12 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="flex flex-col items-center space-y-4">
            <BrandIcon className="w-12 h-12" />
            <div className="flex flex-col text-center">
              <span className="text-2xl font-bold tracking-tight text-white mb-1">
                Betta<span className="text-primary">Bets</span>
              </span>
              <span className="text-xs text-gray-400">Professional Analytics</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">
            Expert analysis for consistent soccer profit. Verified success rates and expert market insights. Please bet responsibly. 18+ Only.
          </p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
