'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  Trophy,
  ChevronRight,
  Calendar,
  XCircle,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import EventFormModal from '@/components/events/EventFormModal';
import {
  listEventsApi,
  createEventApi,
  updateEventApi,
  deleteEventApi,
} from '@/services/event.service';
import type {
  Event,
  CreateEventRequest,
  PaginationMeta,
  ApiErrorResponse,
} from '@/types/auth';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
}
function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

function getEventStatus(event: Event): {
  label: string;
  color: string;
  dot: string;
} {
  const now = Date.now();
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  if (now < start) return { label: 'Akan Datang', color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' };
  if (now >= start && now <= end) return { label: 'Berlangsung', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' };
  return { label: 'Selesai', color: 'text-gray-500 bg-gray-100 border-gray-200', dot: 'bg-gray-400' };
}

// ─── Live Countdown Hook ──────────────────────────────────────────────────────
function useCountdown(endTimeISO: string, startTimeISO: string) {
  const [minutesLeft, setMinutesLeft] = useState<number>(0);
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'finished'>('upcoming');

  useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const start = new Date(startTimeISO).getTime();
      const end = new Date(endTimeISO).getTime();

      if (now < start) {
        setStatus('upcoming');
        const diffMins = Math.floor((start - now) / 60000);
        setMinutesLeft(diffMins);
      } else if (now >= start && now <= end) {
        setStatus('ongoing');
        const diffMins = Math.floor((end - now) / 60000);
        setMinutesLeft(diffMins);
      } else {
        setStatus('finished');
        setMinutesLeft(0);
      }
    };

    calculate();
    const timer = setInterval(calculate, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [endTimeISO, startTimeISO]);

  return { minutesLeft, status };
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({
  event,
  index,
  onEdit,
  onDelete,
}: {
  event: Event;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getEventStatus(event);
  const countdown = useCountdown(event.end_time, event.start_time);

  let countdownText = '';
  let countdownColor = 'text-gray-500';
  if (countdown.status === 'upcoming') {
    countdownText = `Dimulai dalam ${countdown.minutesLeft} menit`;
    countdownColor = 'text-blue-600';
  } else if (countdown.status === 'ongoing') {
    countdownText = `${countdown.minutesLeft} menit akan berakhir`;
    countdownColor = 'text-emerald-600 font-medium';
  } else {
    countdownText = '0 menit (Selesai)';
    countdownColor = 'text-gray-400';
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-700" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {/* Countdown Live Info */}
              <span className={`text-[11px] ${countdownColor}`}>
                {countdownText}
              </span>
            </div>
            <h3 className="text-gray-900 font-bold text-sm leading-snug">{event.name}</h3>
          </div>
          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-all"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar size={11} className="text-gray-400 flex-shrink-0" />
            <span>
              {fmtDate(event.start_time)} • {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-amber-500" />
              {fmtDuration(event.duration_minutes)}
            </span>
            <span className="flex items-center gap-1" title="Total Soal Didaftarkan">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-100 flex items-center justify-center text-[7px] text-blue-600 font-bold border border-blue-200">?</div>
              <strong className="text-gray-700">{event.total_questions || 0}</strong> soal
            </span>
            <span className="flex items-center gap-1">
              <Trophy size={11} className="text-emerald-500" />
              Batas Lulus <strong className="text-gray-700">{event.passing_grade}%</strong>
            </span>
          </div>
        </div>

        {/* Detail button */}
        <Link
          href={`/dashboard/events/${event.id}`}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all"
        >
          Kelola Soal & Peserta
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────
function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [formModal, setFormModal] = useState<{
    open: boolean; mode: 'create' | 'edit'; event: Event | null;
  }>({ open: false, mode: 'create', event: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean; event: Event | null; isLoading: boolean;
  }>({ open: false, event: null, isLoading: false });

  const [formApiError, setFormApiError] = useState<string | null>(null);
  const { toasts, toast, dismiss } = useToast();

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listEventsApi(page, 9, search);
      setEvents(res.data);
      setMeta(res.meta);
    } catch {
      toast('error', 'Gagal memuat data jadwal ujian.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Handle "new=true" from Quick Actions
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setFormModal({ open: true, mode: 'create', event: null });
      const params = new URLSearchParams(searchParams.toString());
      params.delete('new');
      router.replace(`/dashboard/events?${params.toString()}`);
    }
  }, [searchParams, router]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setSearch(searchInput); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ─── Status counts ───────────────────────────────────────────────────────────
  const now = Date.now();
  const activeCount = events.filter((e) => {
    const s = new Date(e.start_time).getTime();
    const en = new Date(e.end_time).getTime();
    return now >= s && now <= en;
  }).length;
  const upcomingCount = events.filter((e) => now < new Date(e.start_time).getTime()).length;

  // ─── CRUD Handlers ───────────────────────────────────────────────────────────
  const handleCreate = async (data: CreateEventRequest) => {
    setFormApiError(null);
    try {
      await createEventApi(data);
      toast('success', 'Jadwal ujian baru berhasil dibuat.');
      setFormModal({ open: false, mode: 'create', event: null });
      fetchEvents();
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message ?? 'Gagal membuat jadwal ujian.'
        : 'Terjadi kesalahan.';
      setFormApiError(msg);
      throw err;
    }
  };

  const handleUpdate = async (data: CreateEventRequest) => {
    if (!formModal.event) return;
    setFormApiError(null);
    try {
      await updateEventApi(formModal.event.id, data);
      toast('success', 'Jadwal ujian berhasil diperbarui.');
      setFormModal({ open: false, mode: 'edit', event: null });
      fetchEvents();
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message ?? 'Gagal memperbarui jadwal.'
        : 'Terjadi kesalahan.';
      setFormApiError(msg);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.event) return;
    setDeleteDialog((d) => ({ ...d, isLoading: true }));
    try {
      await deleteEventApi(deleteDialog.event.id);
      toast('success', `Jadwal "${deleteDialog.event.name}" berhasil dihapus.`);
      setDeleteDialog({ open: false, event: null, isLoading: false });
      fetchEvents();
    } catch {
      toast('error', 'Gagal menghapus jadwal ujian.');
      setDeleteDialog((d) => ({ ...d, isLoading: false }));
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <CalendarDays size={18} className="text-amber-700" />
          </div>
          <p className="text-gray-500 text-sm">
            Buat dan kelola sesi ujian, soal, serta peserta
          </p>
        </div>
        <button
          id="btn-add-event"
          onClick={() => {
            setFormApiError(null);
            setFormModal({ open: true, mode: 'create', event: null });
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white text-sm font-semibold rounded-xl shadow-sm shadow-amber-900/20 hover:from-[#5C3010] hover:to-[#7C4318] transition-all"
        >
          <Plus size={16} />
          Buat Jadwal Ujian
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium">Total Jadwal</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{meta?.total_records ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <p className="text-emerald-600 text-xs font-medium">Sedang Berlangsung</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
          <p className="text-blue-600 text-xs font-medium">Akan Datang</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{upcomingCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-300 transition-all relative">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari nama ujian..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent pr-6"
            id="search-events"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Hapus filter"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
        <button
          onClick={fetchEvents}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Spinner size={28} className="text-amber-600" />
          <span className="text-sm">Memuat jadwal ujian...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <CalendarDays size={40} className="text-gray-200" />
          <p className="text-sm font-medium text-gray-500">
            {search ? `Tidak ada ujian dengan kata kunci "${search}"` : 'Belum ada jadwal ujian'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, idx) => (
            <EventCard
              key={event.id}
              event={event}
              index={(page - 1) * 9 + idx + 1}
              onEdit={() => {
                setFormApiError(null);
                setFormModal({ open: true, mode: 'edit', event });
              }}
              onDelete={() => setDeleteDialog({ open: true, event, isLoading: false })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs">
            Menampilkan {(page - 1) * 9 + 1}–{Math.min(page * 9, meta.total_records)} dari{' '}
            {meta.total_records} jadwal
          </p>
          <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} isLoading={isLoading} />
        </div>
      )}

      {/* Modals */}
      <EventFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal((s) => ({ ...s, open: false }))}
        mode={formModal.mode}
        event={formModal.event}
        onSubmit={formModal.mode === 'create' ? handleCreate : handleUpdate}
        apiError={formApiError}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, event: null, isLoading: false })}
        onConfirm={handleDelete}
        title="Hapus Jadwal Ujian"
        message={`Hapus jadwal "${deleteDialog.event?.name}" beserta semua data soal dan pesertanya? Tindakan ini tidak dapat dibatalkan.`}
        isLoading={deleteDialog.isLoading}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Spinner size={32} className="text-amber-600" /></div>}>
      <EventsContent />
    </Suspense>
  );
}
