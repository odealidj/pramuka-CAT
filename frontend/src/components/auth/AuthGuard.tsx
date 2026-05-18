'use client';

/**
 * AuthGuard — Komponen proteksi rute
 *
 * Logika:
 * 1. Saat isLoading (silent refresh berlangsung) → tampilkan full-page loader
 * 2. Jika tidak terautentikasi → redirect ke /login
 * 3. Jika terautentikasi → render children
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';
import { FlameKindling } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Menampilkan layar loading saat silent refresh berlangsung
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/25">
          <FlameKindling size={28} className="text-white" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size={24} className="text-amber-700" />
          <p className="text-gray-500 text-sm font-medium">
            Memverifikasi sesi...
          </p>
        </div>
      </div>
    );
  }

  // Jika tidak terautentikasi, jangan render apapun (redirect akan terjadi di useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
