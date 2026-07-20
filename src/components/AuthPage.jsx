import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function AuthPage({ onToggleTheme, themeMode }) {
  const { language, setLanguage, t, languages } = useLanguage();
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
            emailRedirectTo: window.location.origin,
            data: { 
              display_name: displayName || email.split('@')[0],
              language: language || localStorage.getItem('hr_planner_lang') || 'en',
              theme_mode: themeMode || localStorage.getItem('hr_planner_theme') || 'light'
            }
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

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (googleError) throw googleError;
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  function scrollToAuth() {
    const el = document.getElementById('auth-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#121212] text-[#111] dark:text-[#F0F0F0] font-sans selection:bg-[#1D9E75] selection:text-white transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass border-b border-[#E2E0D8] dark:border-[#333] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1D9E75] to-[#16805E] flex items-center justify-center text-xl shadow-md">
            📋
          </div>
          <div>
            <span className="font-kanit text-xl font-bold tracking-tight">Scheduler</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] dark:text-[#26D09A] border border-[#1D9E75]/30">
              v2.0 Enterprise
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#666] dark:text-[#AAA]">
          <a href="#features" className="hover:text-[#1D9E75] dark:hover:text-[#26D09A] transition-colors">{t('navFeatures')}</a>
          <a href="#workflow" className="hover:text-[#1D9E75] dark:hover:text-[#26D09A] transition-colors">{t('navWorkflow')}</a>
          <a href="#multilingual" className="hover:text-[#1D9E75] dark:hover:text-[#26D09A] transition-colors">{t('navMultilingual')}</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-white dark:bg-[#1E1E1E] text-xs font-semibold hover:border-[#1D9E75] transition-all cursor-pointer outline-none shadow-sm"
          >
            {Object.values(languages).map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>

          <button
            onClick={onToggleTheme}
            className="px-3.5 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-white dark:bg-[#1E1E1E] text-xs font-semibold hover:border-[#1D9E75] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>{themeMode === 'dark' ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline">{themeMode === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>

          <button
            onClick={scrollToAuth}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#16805E] text-white font-kanit font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            {t('getStarted')}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/20 text-[#1D9E75] dark:text-[#26D09A] text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
          <span>✨ {t('heroBadge')}</span>
        </div>

        <h1 className="font-kanit text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight mb-6">
          {t('heroTitle1')} <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1D9E75] via-[#26D09A] to-[#3B82F6]">
            {t('heroTitle2')}
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-[#666] dark:text-[#AAA] max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('heroSubtitle')}
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
          <button
            onClick={scrollToAuth}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1D9E75] to-[#16805E] text-white font-kanit font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            🚀 {t('launchWorkspace')}
          </button>
          <a
            href="#features"
            className="px-8 py-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] font-kanit font-bold text-base hover:border-[#888] transition-all shadow-sm"
          >
            {t('exploreCapabilities')}
          </a>
        </div>

        {/* Floating Preview Card */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-[#E2E0D8] dark:border-[#333] bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-xl shadow-2xl p-6 text-left overflow-hidden relative">
          <div className="flex items-center justify-between border-b border-[#E2E0D8] dark:border-[#333] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E24B4A]"></span>
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
              <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
              <span className="ml-2 font-kanit font-bold text-sm text-[#888]">{t('previewWeek1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1D9E75]/15 text-[#1D9E75] dark:text-[#26D09A]">
                🟢 {t('previewProgress')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-[#E2E0D8] dark:border-[#333] bg-[#F9FAFB] dark:bg-[#262626]">
              <div className="font-bold text-sm mb-2 text-[#F39C12]">1 {t('Monday')}</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs line-through text-[#888]">
                  <span className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px]">✓</span>
                  <span>{t('previewTask1')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs line-through text-[#888]">
                  <span className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px]">✓</span>
                  <span>{t('previewTask2')}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[#1D9E75] bg-[#E1F5EE]/40 dark:bg-[#163A2D]/40 relative">
              <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1D9E75] text-white uppercase">
                {t('today')}
              </span>
              <div className="font-bold text-sm mb-2 text-[#EC7063]">2 {t('Tuesday')}</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="w-4 h-4 rounded-full bg-[#1D9E75] text-white flex items-center justify-center text-[10px]">✓</span>
                  <span>{t('previewTask3')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded-full border border-[#888]"></span>
                  <span>{t('previewTask4')}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[#E2E0D8] dark:border-[#333] bg-[#F9FAFB] dark:bg-[#262626] opacity-75">
              <div className="font-bold text-sm mb-2 text-[#2ECC71]">3 {t('Wednesday')}</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#888]">
                  <span className="w-4 h-4 rounded-full border border-[#888]"></span>
                  <span>{t('previewTask5')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-kanit text-3xl sm:text-4xl font-bold mb-3">{t('featuresTitle')}</h2>
          <p className="text-[#888] dark:text-[#AAA] max-w-xl mx-auto">{t('featuresSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] shadow-lg hover:border-[#1D9E75] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[#1D9E75]/10 text-[#1D9E75] dark:text-[#26D09A] flex items-center justify-center text-2xl mb-6">
              🔄
            </div>
            <h3 className="font-kanit text-xl font-bold mb-2">{t('feat1Title')}</h3>
            <p className="text-sm text-[#666] dark:text-[#AAA] leading-relaxed">
              {t('feat1Sub')}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] shadow-lg hover:border-[#1D9E75] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center text-2xl mb-6">
              👑
            </div>
            <h3 className="font-kanit text-xl font-bold mb-2">{t('feat2Title')}</h3>
            <p className="text-sm text-[#666] dark:text-[#AAA] leading-relaxed">
              {t('feat2Sub')}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] shadow-lg hover:border-[#1D9E75] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-2xl mb-6">
              🌐
            </div>
            <h3 className="font-kanit text-xl font-bold mb-2">{t('feat3Title')}</h3>
            <p className="text-sm text-[#666] dark:text-[#AAA] leading-relaxed">
              {t('feat3Sub')}
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#E2E0D8] dark:border-[#333]">
        <div className="text-center mb-12">
          <h2 className="font-kanit text-3xl sm:text-4xl font-bold mb-3">{t('workflowTitle')}</h2>
          <p className="text-[#888] dark:text-[#AAA] max-w-xl mx-auto">{t('workflowSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] shadow-md relative overflow-hidden">
            <div className="w-2 h-full bg-[#10B981] absolute top-0 left-0"></div>
            <div className="text-xs font-bold text-[#10B981] uppercase tracking-wider mb-2">Week 1</div>
            <h3 className="font-kanit font-bold text-lg mb-2">{t('week1Title')}</h3>
            <p className="text-xs text-[#666] dark:text-[#AAA] leading-relaxed">{t('week1Sub')}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] shadow-md relative overflow-hidden">
            <div className="w-2 h-full bg-[#3B82F6] absolute top-0 left-0"></div>
            <div className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-2">Week 2</div>
            <h3 className="font-kanit font-bold text-lg mb-2">{t('week2Title')}</h3>
            <p className="text-xs text-[#666] dark:text-[#AAA] leading-relaxed">{t('week2Sub')}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] shadow-md relative overflow-hidden">
            <div className="w-2 h-full bg-[#F59E0B] absolute top-0 left-0"></div>
            <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-2">Week 3</div>
            <h3 className="font-kanit font-bold text-lg mb-2">{t('week3Title')}</h3>
            <p className="text-xs text-[#666] dark:text-[#AAA] leading-relaxed">{t('week3Sub')}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] shadow-md relative overflow-hidden">
            <div className="w-2 h-full bg-[#8B5CF6] absolute top-0 left-0"></div>
            <div className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-2">Week 4</div>
            <h3 className="font-kanit font-bold text-lg mb-2">{t('week4Title')}</h3>
            <p className="text-xs text-[#666] dark:text-[#AAA] leading-relaxed">{t('week4Sub')}</p>
          </div>
        </div>
      </section>

      {/* Multilingual Section */}
      <section id="multilingual" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#E2E0D8] dark:border-[#333]">
        <div className="text-center mb-12">
          <h2 className="font-kanit text-3xl sm:text-4xl font-bold mb-3">{t('multilingualTitle')}</h2>
          <p className="text-[#888] dark:text-[#AAA] max-w-xl mx-auto">{t('multilingualSubtitle')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3.5 max-w-4xl mx-auto">
          {Object.values(languages).map(l => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-5 py-3 rounded-2xl border text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                language === l.code
                  ? 'bg-[#1D9E75] text-white border-[#1D9E75] shadow-lg scale-105'
                  : 'bg-white dark:bg-[#1E1E1E] border-[#E2E0D8] dark:border-[#333] hover:border-[#1D9E75] text-[#333] dark:text-[#EEE]'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-20 px-6 bg-[#F0EFEB] dark:bg-[#181818] border-y border-[#E2E0D8] dark:border-[#333]">
        <div className="max-w-md mx-auto bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="font-kanit text-2xl font-bold mb-1">
              {isSignUp ? t('signUp') : t('signIn')}
            </h2>
            <p className="text-[#888] dark:text-[#AAA] text-sm">
              {isSignUp ? t('signUpSub') : t('signInSub')}
            </p>
          </div>

          {/* Google OAuth Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-white dark:bg-[#262626] text-[#333] dark:text-[#EEE] font-kanit font-semibold text-sm shadow-sm hover:border-[#1D9E75] hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('continueWithGoogle') || 'Continue with Google'}</span>
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E0D8] dark:border-[#444]"></div>
              </div>
              <span className="relative px-3 bg-white dark:bg-[#1E1E1E] text-xs font-bold text-[#888] uppercase tracking-widest">
                {t('or') || 'OR'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
                  {t('displayName')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-3 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-[#F9FAFB] dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-[#F9FAFB] dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                className="w-full px-4 py-3 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-[#F9FAFB] dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1.5">
                  {t('confirmPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 border border-[#E2E0D8] dark:border-[#444] rounded-xl text-sm bg-[#F9FAFB] dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-colors"
                  required
                />
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-[#FDE8EF] dark:bg-[#3D1D12] border border-[#E24B4A] text-[#E24B4A] text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div className="px-4 py-3 rounded-xl bg-[#E1F5EE] dark:bg-[#163A2D] border border-[#1D9E75] text-[#085041] dark:text-[#85E5C4] text-sm font-medium">
                ✅ {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#16805E] text-white font-kanit font-bold text-base shadow-lg hover:shadow-xl hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : isSignUp ? (
                `🚀 ${t('signUp')}`
              ) : (
                `🔓 ${t('signIn')}`
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#888] dark:text-[#AAA]">
            {isSignUp ? (
              <>
                {t('haveAccount')}{' '}
                <button
                  onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}
                  className="text-[#1D9E75] dark:text-[#26D09A] font-bold hover:underline cursor-pointer"
                >
                  {t('signIn')}
                </button>
              </>
            ) : (
              <>
                {t('noAccount')}{' '}
                <button
                  onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}
                  className="text-[#1D9E75] dark:text-[#26D09A] font-bold hover:underline cursor-pointer"
                >
                  {t('createOne')}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-xs text-[#888] dark:text-[#AAA]">
        <p>{t('footerText')}</p>
      </footer>
    </div>
  );
}
