'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';

// Mapping path → page title
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/questions': 'Bank Soal',
  '/dashboard/categories': 'Kategori Soal',
  '/dashboard/events': 'Jadwal Ujian',
  '/dashboard/users': 'Manajemen Pengguna',
  '/dashboard/settings': 'Pengaturan',
  '/dashboard/profile': 'Profil Saya',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? 'Halaman';

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role="admin"
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-64">
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
