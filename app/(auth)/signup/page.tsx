'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Plan<span style={{ color: '#E62429' }}>R</span>
          </h1>
          <p className="mt-2 text-sm text-foreground/50">Create your account to get started.</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 p-8 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
        >
          {success ? (
            /* Confirmation state */
            <div className="py-4 text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'rgba(230,36,41,0.15)' }}
              >
                <svg className="h-7 w-7" style={{ color: '#E62429' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Check your email</h2>
              <p className="text-sm text-foreground/50">
                We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
                Click the link to activate your account.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-medium hover:underline"
                style={{ color: '#E62429' }}
              >
                Back to login
              </Link>
            </div>
          ) : (
            /* Signup form */
            <>
              <h2 className="mb-6 text-xl font-semibold text-foreground">Create your account</h2>

              <form onSubmit={handleSignup} className="space-y-5">
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
                    <span className="ml-1 text-foreground/30">(min. 6 characters)</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
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
                  {loading ? 'Creating account…' : 'Sign Up'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer link */}
        {!success && (
          <p className="mt-6 text-center text-sm text-foreground/40">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[#E62429] hover:underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
