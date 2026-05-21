'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Trophy,
  Eye,
  Download,
  CalendarDays,
  Filter,
  ClipboardList,
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import AnswerReviewDrawer from '@/components/results/AnswerReviewDrawer';
import { listEventsApi, getExportUrl, listEventParticipantsApi } from '@/services/event.service';
import type { Event, EventParticipant, PaginationMeta } from '@/types/auth';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDateTimeRange(startIso: string, endIso: string) {
  const ds = new Date(startIso);
  const de = new Date(endIso);
  const dateStr = ds.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const tStart = ds.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  const tEnd = de.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  return `${dateStr} ${tStart} - ${tEnd}`;
}
function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

type StatusFilter = 'all' | 'completed' | 'passed' | 'failed' | 'pending';

// ─── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${color}`}>
      <span className="text-xs opacity-70 font-medium">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

// ─── Participant row ──────────────────────────────────────────────────────────
function ParticipantRow({
  participant,
  globalRank,
  passingGrade,
  onReview,
}: {
  participant: EventParticipant;
  globalRank: number | null;
  passingGrade: number;
  onReview: () => void;
}) {
  const isPending  = participant.status.toLowerCase() === 'pending';
  const isCompleted = participant.is_completed;

  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      {/* Rank */}
      <td className="px-4 py-3 text-center w-12">
        {isCompleted && globalRank !== null ? (
          <span
            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
              globalRank === 1
                ? 'bg-amber-400 text-white'
                : globalRank === 2
                ? 'bg-gray-300 text-white'
                : globalRank === 3
                ? 'bg-orange-400 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {globalRank}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Peserta */}
      <td className="px-4 py-3">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{participant.full_name}</p>
          <p className="text-gray-400 text-xs font-mono">@{participant.username}</p>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${
            participant.status.toLowerCase() === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : participant.status.toLowerCase() === 'pending'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {participant.status}
        </span>
      </td>

      {/* Skor */}
      <td className="px-4 py-3 text-center">
        {isCompleted ? (
          <span
            className={`text-base font-bold ${
              participant.is_passed ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {participant.score.toFixed(1)}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">
            {isPending ? 'Pending' : 'Belum selesai'}
          </span>
        )}
      </td>

      {/* Hasil */}
      <td className="px-4 py-3 text-center hidden sm:table-cell">
        {isCompleted ? (
          participant.is_passed ? (
            <span className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-semibold">
              <CheckCircle2 size={13} /> Lulus
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1 text-red-500 text-xs font-semibold">
              <XCircle size={13} /> Tidak Lulus
            </span>
          )
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Aksi */}
      <td className="px-4 py-3 text-right">
        {isCompleted && (
          <button
            onClick={onReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-all ml-auto border border-indigo-200"
          >
            <Eye size={12} />
            Review
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Event Accordion ──────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function EventResultCard({
  event,
  onReviewParticipant,
}: {
  event: Event;
  onReviewParticipant: (participant: EventParticipant, event: Event) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Participants data
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [meta, setMeta]               = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading]     = useState(false);

  // Summary stats (fetched once, not re-fetched on filter/page change)
  const [summary, setSummary] = useState<{
    total: number; completed: number; passed: number; avgScore: number; passRate: number;
  } | null>(null);

  // Filters
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 400);
  };

  // Rank map — only valid when not filtering (all pages shown by score)
  const rankMap = new Map<string, number>();
  if (statusFilter === 'all' || statusFilter === 'completed') {
    let r = (page - 1) * PAGE_SIZE;
    participants.forEach((p) => {
      if (p.is_completed) rankMap.set(p.user_id, ++r);
    });
  }

  const fetchParticipants = useCallback(async (p: number, s: string, sf: StatusFilter) => {
    setIsLoading(true);
    try {
      // Map statusFilter to backend search hint (backend supports free-text search)
      // We pass status as part of search if needed; backend filters by name/username
      const searchTerm = s;
      const res = await listEventParticipantsApi(event.id, p, PAGE_SIZE, searchTerm);

      // Client-side status filter (backend doesn't have status filter param yet)
      let filtered = res.data;
      if (sf === 'completed') filtered = filtered.filter(x => x.is_completed);
      else if (sf === 'passed')    filtered = filtered.filter(x => x.is_completed && x.is_passed);
      else if (sf === 'failed')    filtered = filtered.filter(x => x.is_completed && !x.is_passed);
      else if (sf === 'pending')   filtered = filtered.filter(x => !x.is_completed);

      setParticipants(filtered);
      setMeta(res.meta);

      // Build summary once on first load (page 1, no filter)
      if (p === 1 && !s && sf === 'all' && !summary) {
        const all = res.data;
        const completed = all.filter(x => x.is_completed);
        const passed    = completed.filter(x => x.is_passed);
        const avg       = completed.length > 0
          ? completed.reduce((acc, x) => acc + x.score, 0) / completed.length
          : 0;
        setSummary({
          total: res.meta.total_records,
          completed: completed.length,
          passed: passed.length,
          avgScore: avg,
          passRate: completed.length > 0 ? (passed.length / completed.length) * 100 : 0,
        });
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  useEffect(() => {
    if (isExpanded) fetchParticipants(page, search, statusFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, page, search, statusFilter]);

  const toggle = () => setIsExpanded(v => !v);

  const statusOptions: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'all',       label: 'Semua',        color: 'text-gray-600' },
    { value: 'completed', label: 'Selesai',       color: 'text-blue-600' },
    { value: 'passed',    label: 'Lulus',         color: 'text-emerald-600' },
    { value: 'failed',    label: 'Tidak Lulus',   color: 'text-red-500' },
    { value: 'pending',   label: 'Belum Selesai', color: 'text-amber-600' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Card Header ── */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/60 transition-all"
      >
        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-700 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-sm truncate">{event.name}</h3>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} /> {fmtDateTimeRange(event.start_time, event.end_time)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {fmtDuration(event.duration_minutes)}
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList size={11} className="text-amber-500" /> {event.total_questions || 0} soal
            </span>
            <span className="flex items-center gap-1">
              <Trophy size={11} className="text-emerald-500" /> Batas Lulus {event.passing_grade}%
            </span>
          </div>
        </div>

        {/* Quick stats (shown once fetched) */}
        {summary && (
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Stat label="Peserta"   value={summary.total}                                    color="border-gray-100 text-gray-700" />
            <Stat label="Selesai"   value={summary.completed}                                color="border-blue-100 text-blue-700" />
            <Stat label="Lulus"     value={summary.passed}                                   color="border-emerald-100 text-emerald-700" />
            <Stat label="Rata-rata" value={summary.completed ? summary.avgScore.toFixed(1) : '—'} color="border-amber-100 text-amber-700" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(getExportUrl(event.id, 'excel'), '_blank'); }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-600 border border-emerald-200 text-xs font-medium hover:bg-emerald-50 transition-all"
          >
            <Download size={11} /> Excel
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(getExportUrl(event.id, 'pdf'), '_blank'); }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-500 border border-red-200 text-xs font-medium hover:bg-red-50 transition-all"
          >
            <Download size={11} /> PDF
          </button>
          {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* ── Expanded Content ── */}
      {isExpanded && (
        <div className="border-t border-gray-100">

          {/* Summary bar */}
          {summary && summary.completed > 0 && (
            <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex flex-wrap gap-4 text-sm">
              <span className="text-gray-500">
                Selesai: <strong className="text-gray-800">{summary.completed}</strong> / {summary.total}
              </span>
              <span className="text-gray-500">
                Kelulusan:{' '}
                <strong className={summary.passRate >= 70 ? 'text-emerald-600' : 'text-red-500'}>
                  {summary.passRate.toFixed(1)}%
                </strong>
              </span>
              <span className="text-gray-500">
                Rata-rata: <strong className="text-amber-700">{summary.avgScore.toFixed(1)}</strong>
              </span>
              <span className="text-gray-500">
                Batas Lulus: <strong className="text-gray-800">{event.passing_grade}%</strong>
              </span>
            </div>
          )}

          {/* Filter toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 px-5 py-3 border-b border-gray-100 bg-white">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:border-amber-300 transition-all relative">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari nama atau nomor peserta (contoh: Budi / P-001)..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pr-6"
              />
              {searchInput && (
                <button
                  onClick={() => { handleSearchChange(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Hapus filter"
                >
                  <XCircle size={13} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Filter size={13} className="text-gray-400" />
              <div className="flex gap-1 flex-wrap">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setPage(1); setStatusFilter(opt.value); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      statusFilter === opt.value
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size={22} className="text-amber-600" />
            </div>
          ) : participants.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <Users size={28} className="text-gray-200" />
              <p className="text-sm">
                {search || statusFilter !== 'all'
                  ? 'Tidak ada peserta yang sesuai filter.'
                  : 'Belum ada peserta untuk ujian ini.'}
              </p>
              {(search || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchInput(''); setSearch(''); setStatusFilter('all'); setPage(1); }}
                  className="text-xs text-amber-600 hover:text-amber-800 font-medium mt-1"
                >
                  Hapus semua filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase w-12">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Peserta</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Skor</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">Hasil</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {participants.map((p, idx) => {
                      const rank = p.is_completed
                        ? (statusFilter === 'all' || statusFilter === 'completed' || statusFilter === 'passed' || statusFilter === 'failed')
                          ? rankMap.get(p.user_id) ?? null
                          : null
                        : null;
                      return (
                        <ParticipantRow
                          key={p.user_id}
                          participant={p}
                          globalRank={rank}
                          passingGrade={event.passing_grade}
                          onReview={() => onReviewParticipant(p, event)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {meta && meta.total_records > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                  <p className="text-gray-400 text-xs">
                    Menampilkan {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, meta.total_records)} dari{' '}
                    {meta.total_records} peserta
                    {(search || statusFilter !== 'all') ? ' (terfilter)' : ''}
                  </p>
                  <Pagination
                    page={page}
                    totalPages={meta.total_pages}
                    onPageChange={setPage}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [events, setEvents]           = useState<Event[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Aggregate stats dari semua event yang telah di-load
  const totalEvents = events.length;

  const [reviewState, setReviewState] = useState<{
    participant: EventParticipant | null;
    event: Event | null;
  }>({ participant: null, event: null });

  const { toasts, toast, dismiss } = useToast();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listEventsApi(1, 100, search);
      setEvents(res.data);
    } catch {
      toast('error', 'Gagal memuat data ujian.');
    } finally {
      setIsLoading(false);
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <BarChart3 size={22} className="text-amber-700" />
            Hasil Ujian
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Rekap nilai, rangking, dan review jawaban peserta per ujian
          </p>
        </div>
        <button
          onClick={fetchEvents}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium">Total Ujian</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            {isLoading ? '—' : totalEvents}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium">Sedang Berlangsung</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            {isLoading ? '—' : events.filter(e => {
              const now = new Date();
              return new Date(e.start_time) <= now && new Date(e.end_time) >= now;
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-gray-400 text-xs font-medium">Sudah Selesai</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            {isLoading ? '—' : events.filter(e => new Date(e.end_time) < new Date()).length}
          </p>
        </div>
      </div>

      {/* Search events */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:border-amber-300 transition-all relative">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari nama ujian..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent pr-6"
            id="search-results"
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
      </div>

      {/* Events accordion list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Spinner size={28} className="text-amber-600" />
          <span className="text-sm">Memuat data ujian...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <BarChart3 size={40} className="text-gray-200" />
          <p className="text-sm font-medium text-gray-500">
            {search ? `Tidak ada ujian dengan kata kunci "${search}"` : 'Belum ada data ujian'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventResultCard
              key={event.id}
              event={event}
              onReviewParticipant={(participant, ev) =>
                setReviewState({ participant, event: ev })
              }
            />
          ))}
        </div>
      )}

      {/* Review Drawer */}
      <AnswerReviewDrawer
        participant={reviewState.participant}
        eventName={reviewState.event?.name ?? ''}
        passingGrade={reviewState.event?.passing_grade ?? 70}
        onClose={() => setReviewState({ participant: null, event: null })}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
