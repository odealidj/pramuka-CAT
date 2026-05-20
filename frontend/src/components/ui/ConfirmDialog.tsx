'use client';

import { AlertTriangle, XCircle } from 'lucide-react';
import Spinner from './Spinner';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  error?: string; // pesan error dari backend, ditampilkan sebagai peringatan inline
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message,
  confirmLabel = 'Ya, Hapus',
  isLoading = false,
  error,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-base">{title}</h3>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Error banner — muncul jika operasi gagal (misal kategori masih punya soal) */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
              <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm leading-snug">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {error ? 'Tutup' : 'Batal'}
          </button>
          {/* Sembunyikan tombol hapus jika sudah ada error (tidak perlu coba lagi) */}
          {!error && (
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <Spinner size={14} className="text-white" /> : null}
              {isLoading ? 'Menghapus...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
