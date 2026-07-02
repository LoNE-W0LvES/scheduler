import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPage({ onToggleTheme, themeMode }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split('@')[0] }
          }
        });

        if (signUpError) throw signUpError;
        setMessage('Account created! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.message.includes('already registered')) {
        setError('An account with this email already exists. Please sign in.');
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#121212] flex flex-col items-center justify-center px-4 py-8">
      {/* Theme Toggle */}
      <button
        onClick={onToggleTheme}
        className="absolute top-4 right-4 px-3 py-1.5 rounded-xl border border-[#E2E0D8] dark:border-[#333] text-xs font-medium text-[#444] dark:text-[#CCC] hover:bg-[#F0EFEB] dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer"
      >
        {themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>

      {/* Logo/Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1D9E75] to-[#16805E] mb-4 shadow-lg">
          <span className="text-3xl">📋</span>
        </div>
        <h1 className="font-kanit text-3xl font-bold text-[#111] dark:text-[#F0F0F0]">HR Task Planner</h1>
        <p className="text-[#888] dark:text-[#AAA] text-sm mt-1">Your HR workflow, organized</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-2xl p-6 shadow-xl">
        <h2 className="font-kanit text-xl font-bold text-[#111] dark:text-[#F0F0F0] mb-1">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-[#888] dark:text-[#AAA] text-sm mb-6">
          {isSignUp
            ? 'Set up your HR Task Planner account'
            : 'Welcome back! Enter your credentials'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              className="w-full px-4 py-2.5 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-2.5 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
                required
              />
            </div>
          )}

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-[#FDE8EF] dark:bg-[#3D1D12] border border-[#E24B4A] text-[#E24B4A] text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="px-4 py-2.5 rounded-xl bg-[#E1F5EE] dark:bg-[#163A2D] border border-[#1D9E75] text-[#085041] dark:text-[#85E5C4] text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#16805E] text-white font-kanit font-bold text-sm shadow-lg hover:shadow-xl hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : isSignUp ? (
              '🚀 Create Account'
            ) : (
              '🔓 Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#888] dark:text-[#AAA]">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}
                className="text-[#1D9E75] dark:text-[#26D09A] font-semibold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}
                className="text-[#1D9E75] dark:text-[#26D09A] font-semibold hover:underline cursor-pointer"
              >
                Create one
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#AAA] text-center">
        HR Task Planner &mdash; Organized HR workflow management
      </p>
    </div>
  );
}
