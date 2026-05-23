'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FlameKindling, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import { isAxiosError } from 'axios';
import { registerApi } from '@/services/auth.service';
import type { ApiErrorResponse } from '@/types/auth';

// ============================================================
// Zod Schema — Validasi Form
// ============================================================
const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .min(3, 'Username minimal 3 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Hanya boleh huruf, angka, dan underscore (_)'),
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  full_name: z
    .string()
    .min(1, 'Nama lengkap wajib diisi')
    .min(3, 'Nama lengkap minimal 3 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ============================================================
// Register Page Component
// ============================================================
export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      full_name: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    try {
      await registerApi({
        username: values.username,
        email: values.email,
        full_name: values.full_name,
        password: values.password,
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      if (isAxiosError(err)) {
        const errData = err.response?.data as ApiErrorResponse | undefined;
        // Tangkap pesan error dari API, bisa berupa string (message) atau list of errors
        let errorMsg = 'Gagal melakukan pendaftaran. Silakan coba lagi.';
        if (errData?.message) errorMsg = errData.message;
        if (errData?.errors && errData.errors.length > 0) {
          errorMsg = errData.errors[0].message;
        }
        setApiError(errorMsg);
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

      <div className="relative w-full max-w-md py-8">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#5C3010] to-[#9C5A22] px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative inline-flex w-16 h-16 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-4 shadow-lg">
              <FlameKindling size={32} className="text-amber-300" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Pramuka CAT</h1>
            <p className="text-amber-200/80 text-sm mt-1">Pendaftaran Peserta Baru</p>
          </div>

          {/* Card Body — Form */}
          <div className="px-8 py-8">
            {isSuccess ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                  <FlameKindling size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-gray-900 text-xl font-bold mb-2">Pendaftaran Berhasil! 🎉</h2>
                <p className="text-gray-500 text-sm mb-6">Akun Anda telah berhasil dibuat. Anda akan dialihkan ke halaman login...</p>
                <Spinner size={24} className="text-amber-500 mx-auto" />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-gray-900 text-xl font-bold">Buat Akun Baru</h2>
                  <p className="text-gray-500 text-sm mt-1">Lengkapi data di bawah ini untuk mendaftar</p>
                </div>

                {/* API Error Banner */}
                {apiError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm font-medium">{apiError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  {/* Nama Lengkap */}
                  <div>
                    <label htmlFor="full_name" className="block text-gray-700 text-sm font-semibold mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      disabled={isSubmitting}
                      {...register('full_name')}
                      className={`w-full px-4 py-3 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                        ${
                          errors.full_name
                            ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                            : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                        }`}
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.full_name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-1.5">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      disabled={isSubmitting}
                      {...register('email')}
                      className={`w-full px-4 py-3 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                        ${
                          errors.email
                            ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                            : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                        }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-1.5">
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
                        ${
                          errors.username
                            ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                            : 'border-gray-200 bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
                        }`}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        {...register('password')}
                        className={`w-full px-4 py-3 pr-11 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed
                          ${
                            errors.password
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
                        <AlertCircle size={11} /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white font-semibold py-3 rounded-xl hover:from-[#5C3010] hover:to-[#7C4318] transition-all shadow-lg shadow-amber-900/25 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size={16} className="text-white/80" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      'Daftar Sekarang'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Card Footer */}
          {!isSuccess && (
            <div className="px-8 pb-6 text-center border-t border-gray-100 pt-5 bg-gray-50/50">
              <p className="text-gray-600 text-sm">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-amber-600 font-bold hover:text-amber-700 transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
