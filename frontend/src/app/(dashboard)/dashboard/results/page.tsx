'use client';

import { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import AnswerReviewDrawer from '@/components/results/AnswerReviewDrawer';
import { listEventsApi, getExportUrl } from '@/services/event.service';
import { getEventParticipantsApi } from '@/services/exam.service';
import type { Event, EventParticipant } from '@/types/auth';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtDuration(iso: string | null) {
  if (!iso) return '—';
  return fmtDateTime(iso);
}

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
  rank,
  passingGrade,
  onReview,
}: {
  participant: EventParticipant;
  rank: number;
  passingGrade: number;
  onReview: () => void;
}) {
  const isPending = participant.status.toLowerCase() === 'pending';
  const isCompleted = participant.is_completed;

  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      {/* Rank */}
      <td className="px-5 py-3.5 text-center">
        {isCompleted ? (
          <span
            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
              rank === 1
                ? 'bg-amber-400 text-white'
                : rank === 2
                ? 'bg-gray-300 text-white'
                : rank === 3
                ? 'bg-orange-400 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {rank}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      {/* Peserta */}
      <td className="px-5 py-3.5">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{participant.full_name}</p>
          <p className="text-gray-400 text-xs font-mono">@{participant.username}</p>
        </div>
      </td>
      {/* Status */}
      <td className="px-5 py-3.5">
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
      <td className="px-5 py-3.5 text-center">
        {isCompleted ? (
          <span
            className={`text-lg font-bold ${
              participant.is_passed ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {participant.score.toFixed(1)}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">
            {isPending ? 'Pending' : 'Belum selesai'}
          </span>
        )}
      </td>
      {/* Hasil */}
      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
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
      <td className="px-5 py-3.5 text-right">
        {isCompleted && (
          <button
            onClick={onReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-all ml-auto border border-indigo-200"
          >
            <Eye size={12} />
            Review Jawaban
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Event Accordion ──────────────────────────────────────────────────────────
function EventResultCard({
  event,
  onReviewParticipant,
}: {
  event: Event;
  onReviewParticipant: (participant: EventParticipant, event: Event) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchParticipants = useCallback(async () => {
    if (fetched) return;
    setIsLoading(true);
    try {
      const res = await getEventParticipantsApi(event.id, 1, 100);
      // Sort: completed first, then by score desc
      const sorted = [...res.data].sort((a, b) => {
        if (a.is_completed && !b.is_completed) return -1;
        if (!a.is_completed && b.is_completed) return 1;
        return b.score - a.score;
      });
      setParticipants(sorted);
      setFetched(true);
    } finally {
      setIsLoading(false);
    }
  }, [event.id, fetched]);

  const toggle = () => {
    setIsExpanded((v) => !v);
    if (!fetched) fetchParticipants();
  };

  // Stats
  const completed = participants.filter((p) => p.is_completed);
  const passed = completed.filter((p) => p.is_passed);
  const avgScore =
    completed.length > 0
      ? completed.reduce((s, p) => s + p.score, 0) / completed.length
      : 0;
  const passRate = completed.length > 0 ? (passed.length / completed.length) * 100 : 0;

  // Ranking (only completed)
  let rankCounter = 0;
  const rankMap = new Map<string, number>();
  participants.forEach((p) => {
    if (p.is_completed) rankMap.set(p.user_id, ++rankCounter);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header — clickable */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/60 transition-all"
      >
        {/* Amber accent */}
        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-700 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-sm truncate">{event.name}</h3>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} /> {fmtDate(event.start_time)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {event.duration_minutes} menit
            </span>
            <span className="flex items-center gap-1">
              <Trophy size={11} className="text-emerald-500" /> KKM {event.passing_grade}%
            </span>
          </div>
        </div>

        {/* Quick stats (only if fetched) */}
        {fetched && (
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Stat label="Peserta" value={participants.length} color="border-gray-100 text-gray-700" />
            <Stat label="Selesai" value={completed.length} color="border-blue-100 text-blue-700" />
            <Stat label="Lulus" value={passed.length} color="border-emerald-100 text-emerald-700" />
            <Stat
              label="Rata-rata"
              value={completed.length ? avgScore.toFixed(1) : '—'}
              color="border-amber-100 text-amber-700"
            />
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Export buttons */}
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
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size={22} className="text-amber-600" />
            </div>
          ) : participants.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <Users size={28} className="text-gray-200" />
              <p className="text-sm">Belum ada peserta untuk ujian ini.</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              {completed.length > 0 && (
                <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-500">
                    Peserta Selesai: <strong className="text-gray-800">{completed.length}</strong> / {participants.length}
                  </span>
                  <span className="text-gray-500">
                    Tingkat Kelulusan:{' '}
                    <strong className={passRate >= 70 ? 'text-emerald-600' : 'text-red-500'}>
                      {passRate.toFixed(1)}%
                    </strong>
                  </span>
                  <span className="text-gray-500">
                    Rata-rata Skor: <strong className="text-amber-700">{avgScore.toFixed(1)}</strong>
                  </span>
                  <span className="text-gray-500">
                    KKM: <strong className="text-gray-800">{event.passing_grade}%</strong>
                  </span>
                </div>
              )}

              {/* Participants table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase w-12">Rank</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Peserta</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Skor</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">Hasil</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {participants.map((p) => (
                      <ParticipantRow
                        key={p.user_id}
                        participant={p}
                        rank={rankMap.get(p.user_id) ?? 0}
                        passingGrade={event.passing_grade}
                        onReview={() => onReviewParticipant(p, event)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

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

  // Aggregate quick stats
  const totalEvents = events.length;

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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium">Total Ujian</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{totalEvents}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 border border-amber-100 shadow-sm col-span-1 sm:col-span-2">
          <p className="text-amber-700 text-xs font-medium">Cara Menggunakan</p>
          <p className="text-gray-600 text-sm mt-1">
            Klik nama ujian untuk memperluas daftar peserta. Klik{' '}
            <span className="font-semibold text-indigo-600">Review Jawaban</span>{' '}
            untuk melihat detail jawaban benar/salah per soal.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:border-amber-300 transition-all">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari nama ujian..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
            id="search-results"
          />
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
