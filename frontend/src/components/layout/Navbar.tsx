'use client';

import { Bell, Menu, Search, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';

interface NavbarProps {
  onMenuToggle: () => void;
  pageTitle?: string;
}

/** Menghasilkan inisial dari nama lengkap (misal: "Budi Santoso" → "BS") */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');
}

export default function Navbar({ onMenuToggle, pageTitle = 'Dashboard' }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsProfileOpen(false);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.full_name || user?.username || 'Pengguna';
  const initials = getInitials(displayName);
  const roleLabel = user?.role === 'admin' ? 'Admin / Panitia' : 'Peserta';

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="flex items-center gap-3 h-full px-4 lg:px-6">

        {/* Hamburger (Mobile only) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Page Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-gray-900 font-semibold text-base truncate">
            {pageTitle}
          </h1>
          <p className="text-gray-400 text-xs hidden sm:block">
            Pramuka CAT — {roleLabel}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* Search — Desktop */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-52 group focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:bg-white transition-all">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari sesuatu..."
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
            />
          </div>

          {/* Search — Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Notification Bell */}
          <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-all"
              aria-label="Profile menu"
            >
              {/* Avatar with Initials */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-gray-800 text-sm font-semibold leading-tight truncate max-w-[120px]">
                  {displayName}
                </p>
                <p className="text-gray-400 text-xs">{roleLabel}</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform hidden sm:block ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-100">
                  <p className="text-gray-800 text-sm font-semibold truncate">
                    {displayName}
                  </p>
                  <p className="text-gray-500 text-xs">{user?.username}</p>
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {roleLabel}
                  </span>
                </div>

                <div className="p-2">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User size={15} className="text-gray-400" />
                    Profil Saya
                  </Link>
                </div>

                <div className="p-2 pt-0 border-t border-gray-100">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    id="btn-logout"
                  >
                    {isLoggingOut ? (
                      <Spinner size={15} className="text-red-500" />
                    ) : (
                      <LogOut size={15} />
                    )}
                    {isLoggingOut ? 'Keluar...' : 'Keluar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (expandable) */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-3 -mt-1">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:bg-white transition-all">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Cari sesuatu..."
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
}
