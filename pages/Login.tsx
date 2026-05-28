
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Trophy, Mail, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/Toast';

import { useAuth } from '../lib/AuthContext';

const Login: React.FC = () => {
  const { showToast } = useToast();
  const { user, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Auto-redirect if already logged in and profile exists
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<{data: any, error: any}>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check your network or refresh the page.')), 15000)
      );

      const { data, error: authError } = await Promise.race([signInPromise, timeoutPromise]);

      if (authError) {
        throw authError; // Caught below
      }

      if (data.user) {
        showToast(`Verifying account...`, "info");
        await refreshProfile(data.user.id);
        // The useEffect above will trigger the navigation once `user` is set in AuthContext
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to connect to authentication server.");
      showToast(err.message || "Failed to connect to authentication server.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex bg-primary/10 p-4 rounded-2xl border border-primary/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-6xl font-black italic uppercase tracking-tighter">Member <span className="text-primary">Login</span></h2>
          <div className="technical-label opacity-40 uppercase tracking-[0.4em]">Secure Protocol Access</div>
        </div>

        <form onSubmit={handleSubmit} className="glass p-12 space-y-10 border-white/5 relative bg-[#0d0f0d]/40">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center italic"
            >
              Auth Failure: {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between px-1">
              <label className="technical-label">Email Address</label>
            </div>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-6 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between px-1">
              <label className="technical-label">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-6 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-6 flex items-center justify-center gap-4 group disabled:opacity-30 disabled:grayscale"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="technical-label !opacity-100 italic !font-black !text-black">Signing In...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center technical-label opacity-60">
          Don't have an account? <Link to="/register" className="text-primary hover:underline italic font-black">Register Now</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
