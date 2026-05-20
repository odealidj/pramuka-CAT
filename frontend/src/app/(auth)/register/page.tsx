'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FlameKindling, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import { isAxiosError } from 'axios';
import { registerApi } from '@/services/auth.service';
import type { ApiErrorResponse } from '@/types/auth';
import Link from 'next/link';

// ============================================================
// Zod Schema — Validasi Form Registrasi
// ============================================================
const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .min(3, 'Username minimal 3 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore'),
  full_name: z
    .string()
    .min(1, 'Nama lengkap wajib diisi')
    .min(3, 'Nama lengkap minimal 3 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
  confirm_password: z
    .string()
    .min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Password tidak cocok',
  path: ['confirm_password'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ============================================================
// Register Page Component
// ============================================================
export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      full_name: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    setApiSuccess(null);
    try {
      await registerApi({
        username: values.username,
        full_name: values.full_name,
        password: values.password,
      });
      setApiSuccess('Registrasi berhasil! Silakan login dengan akun Anda.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      if (isAxiosError(err)) {
        const errData = err.response?.data as ApiErrorResponse | undefined;
        setApiError(
          errData?.message ||
            'Gagal melakukan registrasi. Pastikan username belum digunakan.'
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
          <div className="bg-gradient-to-r from-[#5C3010] to-[#9C5A22] px-8 py-6 text-center relative overflow-hidden">
            {/* Decorative circle in header */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />

            <div className="relative inline-flex w-12 h-12 rounded-xl bg-white/15 backdrop-blur items-center justify-center mb-3 shadow-lg">
              <FlameKindling size={24} className="text-amber-300" />
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">
              Pendaftaran Akun
            </h1>
            <p className="text-amber-200/80 text-xs mt-1">
              Sistem Computer Assisted Test
            </p>
          </div>

          {/* Card Body — Form */}
          <div className="px-8 py-6">
            <div className="mb-5">
              <h2 className="text-gray-900 text-lg font-bold">
                Buat Akun Baru 📝
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                Lengkapi data di bawah ini untuk mendaftar
              </p>
            </div>

            {/* API Error Banner */}
            {apiError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-xs font-medium">{apiError}</p>
              </div>
            )}

            {/* API Success Banner */}
            {apiSuccess && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-700 text-xs font-medium">{apiSuccess}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-gray-700 text-xs font-semibold mb-1.5"
                >
                  Nama Lengkap
                </label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  disabled={isSubmitting || !!apiSuccess}
                  {...register('full_name')}
                  className={`w-full px-3 py-2.5 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.full_name
                      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                      : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                    }`}
                />
                {errors.full_name && (
                  <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-gray-700 text-xs font-semibold mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan username"
                  disabled={isSubmitting || !!apiSuccess}
                  {...register('username')}
                  className={`w-full px-3 py-2.5 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.username
                      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                      : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                    }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-gray-700 text-xs font-semibold mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={isSubmitting || !!apiSuccess}
                    {...register('password')}
                    className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
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
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirm_password"
                  className="block text-gray-700 text-xs font-semibold mb-1.5"
                >
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={isSubmitting || !!apiSuccess}
                    {...register('confirm_password')}
                    className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                      ${errors.confirm_password
                        ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !!apiSuccess}
                id="btn-register"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white text-sm font-semibold py-2.5 rounded-xl hover:from-[#5C3010] hover:to-[#7C4318] transition-all shadow-md shadow-amber-900/25 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={14} className="text-white/80" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>
          </div>

          {/* Card Footer */}
          <div className="px-8 pb-6 text-center border-t border-gray-100 pt-4 bg-gray-50/50">
            <p className="text-gray-600 text-xs">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-amber-700 font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
