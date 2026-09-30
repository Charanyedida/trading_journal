'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setMessage('Confirmation email sent! Please check your inbox to activate your account.');
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setMessage(null);
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#080b11] text-[#e8ecf4] overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[110px] pointer-events-none" />

      {/* Subtle grid mesh overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px]"
      >
        {/* Main Card */}
        <div className="bg-[#121620]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Subtle card top highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-3 group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-60 blur-md group-hover:opacity-100 transition duration-500" />
              <div className="relative w-13 h-13 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <TrendingUp className="w-7 h-7 text-white stroke-[2.2]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                Trade<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Log</span>
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-sm text-[#9aa3b8] mt-1.5 font-normal">
              {isSignUp
                ? 'Create your account to start tracking trades'
                : 'Welcome back! Sign in to access your journal'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-[#191f2c]/80 border border-white/[0.05]">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                !isSignUp
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-[#9aa3b8] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
                setMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                isSignUp
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-[#9aa3b8] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/10 bg-[#171c28] hover:bg-[#1f2637] active:scale-[0.99] text-sm font-medium text-white transition duration-200 shadow-sm hover:border-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none group"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#121620] text-[#636d80] uppercase tracking-wider font-semibold">
                or with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#9aa3b8] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#636d80]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#171c28] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#5a6478] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#9aa3b8] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#636d80]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#171c28] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#5a6478] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#636d80] hover:text-[#9aa3b8] transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error & Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </motion.div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Free Account' : 'Sign In to Journal'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          {/* Security & Features Banner */}
          <div className="mt-7 pt-5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#636d80]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Supabase RLS Protected
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Cloud Synchronized
            </span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#5a6478] mt-6">
          TradeLog &copy; {new Date().getFullYear()} &middot; Built for disciplined traders
        </p>
      </motion.div>
    </div>
  );
}
