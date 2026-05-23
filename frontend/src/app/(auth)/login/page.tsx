'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FlameKindling, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';
import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/auth';
import Link from 'next/link';

// ============================================================
// Zod Schema — Validasi Form
// ============================================================
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .min(3, 'Username minimal 3 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ============================================================
// Login Page Component
// ============================================================
export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      await login(values.username, values.password);
    } catch (err) {
      // Tangkap error dari API dan tampilkan pesan yang user-friendly
      if (isAxiosError(err)) {
        const errData = err.response?.data as ApiErrorResponse | undefined;
        setApiError(
          errData?.message ||
            'Username atau password salah. Silakan coba lagi.'
        );
      } else {
        setApiError('Terjadi kesalahan. Silakan coba beberapa saat lagi.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B1F0A] via-[#5C3010] to-[#7C4318] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#5C3010] to-[#9C5A22] px-8 py-8 text-center relative overflow-hidden">
            {/* Decorative circle in header */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />

            <div className="relative inline-flex w-16 h-16 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-4 shadow-lg">
              <FlameKindling size={32} className="text-amber-300" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              Pramuka CAT
            </h1>
            <p className="text-amber-200/80 text-sm mt-1">
              Sistem Computer Assisted Test
            </p>
          </div>

          {/* Card Body — Form */}
          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-gray-900 text-xl font-bold">
                Selamat Datang! 👋
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Silakan masuk untuk melanjutkan ke sistem
              </p>
            </div>

            {/* API Error Banner */}
            {apiError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm font-medium">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-gray-700 text-sm font-semibold mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan username Anda"
                  disabled={isSubmitting}
                  {...register('username')}
                  className={`w-full px-4 py-3 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.username
                      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                      : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                    }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-gray-700 text-sm font-semibold mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    {...register('password')}
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                      ${errors.password
                        ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                id="btn-login"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white font-semibold py-3 rounded-xl hover:from-[#5C3010] hover:to-[#7C4318] transition-all shadow-lg shadow-amber-900/25 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={16} className="text-white/80" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>
          </div>

          {/* Card Footer */}
          <div className="px-8 pb-6 text-center border-t border-gray-100 pt-5 bg-gray-50/50">
            <p className="text-gray-600 text-sm mb-3">
              Belum punya akun?{' '}
              <Link href="/register" className="text-amber-600 font-bold hover:text-amber-700 transition-colors">
                Daftar di sini
              </Link>
            </p>
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} Gerakan Pramuka — Sistem Ujian Digital
            </p>
          </div>
        </div>

        {/* Hint credentials (dev only — hapus di production) */}
        <div className="mt-4 bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-center">
          <p className="text-amber-200/60 text-xs">
            Dev hint — Admin: <span className="font-mono text-amber-300">admin_pramuka</span> / <span className="font-mono text-amber-300">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
