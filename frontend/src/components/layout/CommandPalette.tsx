'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, LayoutDashboard, Users, BookOpen, CalendarDays, Settings, ShieldCheck, ClipboardList, BarChart3, Command } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PaletteItem {
  id: string;
  label: string;
  type: 'navigate' | 'action';
  href?: string;
  actionId?: 'question' | 'event' | 'user';
  icon: React.ReactNode;
  roles: ('admin' | 'peserta' | 'super_admin')[];
  category: string;
}

const ITEMS: PaletteItem[] = [
  // Navigasi
  { id: 'nav-dashboard', label: 'Buka Dashboard', type: 'navigate', href: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'peserta', 'super_admin'], category: 'Navigasi Menu' },
  { id: 'nav-questions', label: 'Buka Bank Soal', type: 'navigate', href: '/dashboard/questions', icon: <BookOpen size={18} />, roles: ['admin', 'super_admin'], category: 'Navigasi Menu' },
  { id: 'nav-categories', label: 'Buka Kategori Soal', type: 'navigate', href: '/dashboard/categories', icon: <ClipboardList size={18} />, roles: ['admin', 'super_admin'], category: 'Navigasi Menu' },
  { id: 'nav-events', label: 'Buka Jadwal Ujian', type: 'navigate', href: '/dashboard/events', icon: <CalendarDays size={18} />, roles: ['admin', 'peserta', 'super_admin'], category: 'Navigasi Menu' },
  { id: 'nav-results', label: 'Buka Hasil Ujian', type: 'navigate', href: '/dashboard/results', icon: <BarChart3 size={18} />, roles: ['admin', 'super_admin'], category: 'Navigasi Menu' },
  { id: 'nav-users', label: 'Buka Manajemen Pengguna', type: 'navigate', href: '/dashboard/users', icon: <Users size={18} />, roles: ['admin', 'super_admin'], category: 'Navigasi Menu' },
  { id: 'nav-profile', label: 'Buka Profil Saya & Pengaturan', type: 'navigate', href: '/dashboard/profile', icon: <Settings size={18} />, roles: ['admin', 'peserta', 'super_admin'], category: 'Navigasi Menu' },
  
  // Aksi Cepat
  { id: 'act-question', label: 'Buat Soal Baru', type: 'action', actionId: 'question', icon: <Plus size={18} />, roles: ['admin', 'super_admin'], category: 'Aksi Cepat' },
  { id: 'act-event', label: 'Buat Jadwal Ujian Baru', type: 'action', actionId: 'event', icon: <Plus size={18} />, roles: ['admin', 'super_admin'], category: 'Aksi Cepat' },
  { id: 'act-user', label: 'Tambah Peserta Baru', type: 'action', actionId: 'user', icon: <Plus size={18} />, roles: ['admin', 'super_admin'], category: 'Aksi Cepat' },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'peserta';

  // Filter items based on role and query
  const filteredItems = ITEMS.filter(item => 
    item.roles.includes(role as any) && 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  // Group by category for rendering
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PaletteItem[]>);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle global shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : document.dispatchEvent(new CustomEvent('openCommandPalette'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (item: PaletteItem) => {
    if (item.type === 'navigate' && item.href) {
      router.push(item.href);
    } else if (item.type === 'action' && item.actionId) {
      // Dispatch a custom event to trigger quick action modals in the layout
      window.dispatchEvent(new CustomEvent('triggerQuickAction', { detail: item.actionId }));
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 px-4">
      <div className="fixed inset-0 bg-transparent" onClick={onClose} />
      
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col transform scale-100 animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <Search size={20} className="text-amber-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none px-3 py-1 text-gray-800 placeholder-gray-400 text-base font-medium"
            placeholder="Cari menu atau perintah..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1.5 hidden sm:flex">
             <kbd className="bg-gray-200/60 text-gray-500 rounded px-1.5 py-0.5 text-[10px] font-semibold border border-gray-300 border-b-2">ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2" onMouseLeave={() => setSelectedIndex(-1)}>
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Pencarian tidak ditemukan.</p>
              <p className="text-gray-400 text-sm mt-1">Coba kata kunci lain.</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  {category}
                </div>
                {items.map((item) => {
                  const globalIndex = filteredItems.findIndex(i => i.id === item.id);
                  const isSelected = selectedIndex === globalIndex;
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer mb-0.5
                        ${isSelected ? 'bg-amber-50 text-amber-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      onClick={() => handleSelect(item)}
                    >
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.icon}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-amber-900' : ''}`}>
                        {item.label}
                      </span>
                      {isSelected && (
                        <div className="ml-auto text-xs text-amber-600 font-medium">
                          Enter
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        {/* Footer info */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center hidden sm:flex">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><kbd className="bg-gray-200/60 rounded px-1 text-[10px] border border-gray-300">↑</kbd><kbd className="bg-gray-200/60 rounded px-1 text-[10px] border border-gray-300">↓</kbd> Navigasi</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-gray-200/60 rounded px-1 text-[10px] border border-gray-300">↵</kbd> Pilih</span>
          </div>
          <div className="flex items-center gap-1">
            Pramuka CAT <Command size={10} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
