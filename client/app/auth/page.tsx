'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Use at least 12 characters')
    .max(72, 'Password must not exceed 72 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const productHighlights = [
  { icon: Sparkles, text: 'Evaluate agent quality with focused, repeatable tests.' },
  { icon: BarChart3, text: 'Turn each run into a clear, actionable report.' },
  { icon: LockKeyhole, text: 'Keep endpoint credentials encrypted at rest.' },
];

const strengthStyles = [
  { label: 'Very weak', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Good', bar: 'bg-sky-500', text: 'text-sky-600' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-600' },
];

function getPasswordStrength(password: string) {
  if (!password) return 0;

  let score = password.length >= 8 ? 1 : 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(4, Math.max(1, Math.ceil(score / 1.5)));
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const style = strength > 0 ? strengthStyles[strength - 1] : null;

  return (
    <div className="-mt-1 rounded-xl bg-slate-50 px-3.5 py-3" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 rounded-full transition-colors duration-300 ${
              style && segment <= strength ? style.bar : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3 text-xs">
        <span className="leading-5 text-slate-500">
          Use 12+ characters with uppercase, numbers, and symbols.
        </span>
        <span className={`shrink-0 font-semibold ${style?.text ?? 'text-slate-400'}`}>
          {style?.label ?? 'Strength'}
        </span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const registrationPassword = registerForm.watch('password', '');

  const switchTab = (tab: 'login' | 'register') => {
    setAuthError(null);
    setActiveTab(tab);
  };

  const onLogin = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      const response = await apiClient.login(data);
      authUtils.setToken(response.access_token);
      const currentUser = await apiClient.getCurrentUser();
      queryClient.clear();
      setUser(currentUser);

      toast.success('Logged in successfully!');
      router.push('/home');
    } catch (error) {
      authUtils.logout();
      setUser(null);
      const message = getApiErrorMessage(error, 'Login failed');
      setAuthError(message);
      toast.error(message);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setAuthError(null);
    try {
      await apiClient.register({
        email: data.email,
        password: data.password,
      });
      
      toast.success('Registration successful! Please login.');
      loginForm.setValue('email', data.email);
      switchTab('login');
      registerForm.reset();
    } catch (error) {
      const message = getApiErrorMessage(error, 'Registration failed');
      setAuthError(message);
      toast.error(message);
    }
  };

  return (
    <main className="min-h-[100svh] bg-[#f7f9fc] lg:grid lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col xl:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.32),transparent_28%),radial-gradient(circle_at_80%_75%,rgba(124,58,237,0.28),transparent_30%)]" />
        <div className="absolute -right-28 top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border border-cyan-300/10" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <Image src="/brand/aprep-mark.png" alt="APREP" width={36} height={36} priority />
          </div>
          <span className="text-lg font-semibold tracking-tight">APREP</span>
        </div>

        <div className="relative my-auto max-w-lg py-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Agent quality, made clear
          </p>
          <h1 className="max-w-md text-4xl font-semibold leading-[1.08] tracking-tight xl:text-5xl">
            Build confidence in every agent response.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300 xl:text-lg">
            APREP gives your team one calm workspace to test behavior, spot risks, and share results.
          </p>

          <div className="mt-10 space-y-5">
            {productHighlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-400">Built for thoughtful AI evaluation.</p>
      </section>

      <section className="flex min-h-[100svh] items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[29rem]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-slate-900/15">
              <Image src="/brand/aprep-mark.png" alt="APREP" width={36} height={36} priority />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-950">APREP</span>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-primary-700">Welcome to APREP</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {activeTab === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {activeTab === 'login'
                ? 'Continue evaluating the agents that matter to your team.'
                : 'Start with a secure account and your first agent evaluation.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.28)]">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Authentication options">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'login'}
                onClick={() => switchTab('login')}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'register'}
                onClick={() => switchTab('register')}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Create account
              </button>
            </div>

            <div className="px-4 pb-4 pt-7 sm:px-6 sm:pb-6">
              {authError && (
                <div
                  className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="leading-5">{authError}</span>
                </div>
              )}

              {activeTab === 'login' && (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5" noValidate>
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus:ring-primary-500"
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')}
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus:ring-primary-500"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register('password')}
                  />
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold shadow-lg shadow-slate-900/15 hover:bg-primary-700"
                    isLoading={loginForm.formState.isSubmitting}
                  >
                    <span>Sign in</span>
                    {!loginForm.formState.isSubmitting && (
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </form>
              )}

              {activeTab === 'register' && (
                <form
                  onSubmit={registerForm.handleSubmit(onRegister)}
                  className="space-y-5"
                  noValidate
                >
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus:ring-primary-500"
                    error={registerForm.formState.errors.email?.message}
                    {...registerForm.register('email')}
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="At least 12 characters"
                    autoComplete="new-password"
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus:ring-primary-500"
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register('password')}
                  />
                  <PasswordStrengthMeter password={registrationPassword} />
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus:ring-primary-500"
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register('confirmPassword')}
                  />
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold shadow-lg shadow-slate-900/15 hover:bg-primary-700"
                    isLoading={registerForm.formState.isSubmitting}
                  >
                    <span>Create account</span>
                    {!registerForm.formState.isSubmitting && (
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary-600"
                      aria-hidden="true"
                    />
                    Use at least 12 characters to keep your account secure.
                  </p>
                </form>
              )}
            </div>
          </div>

          <p className="mt-7 text-center text-xs text-slate-400">
            Secure evaluation starts with a well-protected workspace.
          </p>
        </div>
      </section>
    </main>
  );
}

// Made with Bob
