// frontend/src/app/login/page.tsx
'use client'; // Required for buttons/forms in Next.js
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/api';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const sessionExpired = searchParams.get('reason') === 'expired';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call the Backend
      const res = await api.post('/auth/login', { email, password });

      // Save Token to LocalStorage (The Browser's Pocket)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ name: res.data.name, id: res.data.userId }));

      // Return the user to wherever they were headed, if anywhere.
      router.push(next && next.startsWith('/') ? next : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 relative overflow-hidden font-sans text-gray-900">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-gray-200/80 p-8 rounded-2xl shadow-xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="text-3xl font-black text-blue-600 tracking-tighter mb-2">
            MegaMart<span className="text-gray-900">.ai</span>
          </div>
          <p className="text-sm text-gray-500 font-semibold">Welcome back! Log in to continue.</p>
        </div>
        
        {sessionExpired && !error && (
          <div className="bg-amber-50 border border-amber-100 text-amber-700 p-4 mb-6 rounded-xl text-sm font-medium flex items-center gap-2">
            Your session expired. Please sign in again.
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 mb-6 rounded-xl text-sm font-medium flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900 placeholder-gray-400 outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900 placeholder-gray-400 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-500/20"
          >
            Sign In <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 font-semibold">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:text-indigo-600 font-bold transition">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}