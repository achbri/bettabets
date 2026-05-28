
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole, SubscriptionType } from '../types';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Crown, Mail, Lock, User as UserIcon, Globe, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

import { useAuth } from '../lib/AuthContext';

const Register: React.FC = () => {
  const { showToast } = useToast();
  const { user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    country: 'Cameroon'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if user is already logged in and we have their profile
  useEffect(() => {
    if (user) {
      if (user.role === UserRole.ADMIN) {
        navigate('/admin', { replace: true });
      } else {
        // Just logged in or registered normal user, take them to payment/dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const countries = [
    "Cameroon", "Nigeria", "Ghana", "Kenya", "South Africa", "Uganda", 
    "Ivory Coast", "Senegal", "Zambia", "Tanzania", "United Kingdom", "USA"
  ];

  const verifyProfile = async (userId: string, retries = 5): Promise<User | null> => {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) return data as User;
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signUpPromise = supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            country: formData.country
          }
        }
      });
      const timeoutPromise = new Promise<{data: any, error: any}>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check your network or refresh the page.')), 15000)
      );

      const { data, error: signUpError } = await Promise.race([signUpPromise, timeoutPromise]);

      if (signUpError) throw new Error(signUpError.message);

      if (data.user) {
        const profile = await verifyProfile(data.user.id);
        const isMasterAdmin = formData.email.toLowerCase() === 'admin@betta.com';
        
        if (profile) {
          await supabase.from('profiles').update({
            username: formData.username,
            country: formData.country,
            role: isMasterAdmin ? UserRole.ADMIN : UserRole.USER,
            subscription: isMasterAdmin ? SubscriptionType.VVIP : SubscriptionType.FREE
          }).eq('id', data.user.id);
          
          const updatedProfile = await verifyProfile(data.user.id);
          if (updatedProfile) {
            await refreshProfile(data.user.id);
            showToast(`Welcome to the Elite, ${formData.username}!`, "success");
            // The useEffect will handle the final redirect automatically
          }
        } else {
          showToast("Account created! Redirecting to login...", "info");
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.message || "Registration failed.");
      showToast(err.message || "Registration failed.", "error");
      setLoading(false); // Only stop loading if there was an error
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/5 blur-[180px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex bg-primary/10 p-4 rounded-2xl border border-primary/20 mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-6xl font-black italic uppercase tracking-tighter line-clamp-1">Account <span className="text-primary">Registration</span></h2>
          <div className="technical-label opacity-40 uppercase tracking-[0.4em]">Join the Elite</div>
        </div>

        <form onSubmit={handleSubmit} className="glass p-12 space-y-8 border-white/5 relative bg-[#0d0f0d]/40">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center italic"
            >
              Sign Up Error: {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="technical-label">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="technical-label">Country</label>
              <div className="relative">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select 
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-sm outline-none focus:border-primary/50 transition-all appearance-none text-gray-300"
                >
                  {countries.map(c => <option key={c} value={c} className="bg-dark-bg">{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="technical-label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="technical-label">Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-6 flex items-center justify-center gap-4 group disabled:opacity-30 disabled:grayscale mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="technical-label !opacity-100 italic !font-black !text-black">Registering...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center technical-label opacity-60">
          Already Registered? <Link to="/login" className="text-primary hover:underline italic font-black">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
