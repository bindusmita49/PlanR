'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Plan<span style={{ color: '#E62429' }}>R</span>
          </h1>
          <p className="mt-2 text-sm text-foreground/50">Welcome back. Sign in to continue.</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 p-8 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
        >
          <h2 className="mb-6 text-xl font-semibold text-foreground">Log in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder-foreground/30 outline-none transition focus:border-[#E62429] focus:ring-1 focus:ring-[#E62429]"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder-foreground/30 outline-none transition focus:border-[#E62429] focus:ring-1 focus:ring-[#E62429]"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-[#E62429]/30 bg-[#E62429]/10 px-4 py-3 text-sm text-[#E62429]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#E62429' }}
            >
              {loading ? 'Signing in…' : 'Log In'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-foreground/40">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-[#E62429] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
