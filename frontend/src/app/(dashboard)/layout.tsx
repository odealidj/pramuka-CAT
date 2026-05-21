'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

// Mapping path → page title
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/questions': 'Bank Soal',
  '/dashboard/categories': 'Kategori Soal',
  '/dashboard/events': 'Jadwal Ujian',
  '/dashboard/results': 'Hasil Ujian',
  '/dashboard/users': 'Manajemen Pengguna',
  '/dashboard/profile': 'Profil Saya',
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? 'Halaman';
  const { user } = useAuth();

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={(user?.role as 'admin' | 'peserta') ?? 'peserta'}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className={`flex flex-col flex-1 h-screen overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Navbar */}
        <Navbar
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          pageTitle={pageTitle}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 px-6 py-3 bg-white">
          <p className="text-gray-400 text-xs text-center">
            © {new Date().getFullYear()} Pramuka CAT — Sistem Ujian Digital. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['admin', 'peserta']}>
      <DashboardContent>{children}</DashboardContent>
    </AuthGuard>
  );
}
