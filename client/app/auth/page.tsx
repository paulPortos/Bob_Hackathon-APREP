'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginFormData) => {
    try {
      const response = await apiClient.login(data);
      authUtils.setToken(response.access_token);
      
      // Set user in store (we'll use email as user info)
      setUser({ id: '', email: data.email, created_at: new Date().toISOString() });
      
      toast.success('Logged in successfully!');
      router.push('/home');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      await apiClient.register({
        email: data.email,
        password: data.password,
      });
      
      toast.success('Registration successful! Please login.');
      setActiveTab('login');
      registerForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">APREP</h1>
          <p className="text-gray-600 mt-2">Agent Prompt Evaluation Platform</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={loginForm.formState.errors.email?.message}
              {...loginForm.register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register('password')}
            />
            <Button
              type="submit"
              className="w-full"
              isLoading={loginForm.formState.isSubmitting}
            >
              Login
            </Button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={registerForm.formState.errors.email?.message}
              {...registerForm.register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={registerForm.formState.errors.password?.message}
              {...registerForm.register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={registerForm.formState.errors.confirmPassword?.message}
              {...registerForm.register('confirmPassword')}
            />
            <Button
              type="submit"
              className="w-full"
              isLoading={registerForm.formState.isSubmitting}
            >
              Register
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// Made with Bob
