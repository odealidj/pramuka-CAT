'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Shuffle,
  Trash2,
  CheckCircle,
  Clock,
  Download,
  AlertCircle,
  Plus,
  XCircle,
  Trophy,
  Search,
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import {
  getEventApi,
  listEventQuestionsApi,
  addEventQuestionApi,
  addRandomEventQuestionsApi,
  removeEventQuestionApi,
  listEventParticipantsApi,
  approveParticipantApi,
  revokeParticipantApi,
  getExportUrl,
} from '@/services/event.service';
import { listQuestionsApi } from '@/services/question.service';
import { listCategoriesApi } from '@/services/category.service';
import type {
  Event,
  Question,
  EventParticipant,
  Category,
} from '@/types/auth';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  const cls = map[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

type Tab = 'questions' | 'participants';

export default function EventManagerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const eventId = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [tab, setTab] = useState<Tab>('questions');

  // ── Questions state ────────────────────────────────────────────────────────
  const [eventQuestions, setEventQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);

  // Bank questions picker state
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [addingQId, setAddingQId] = useState<string | null>(null);

  // For random pull
  const [categories, setCategories] = useState<Category[]>([]);
  const [randomForm, setRandomForm] = useState({ category_id: '', amount: '5' });
  const [randomLoading, setRandomLoading] = useState(false);

  // ── Participants state ─────────────────────────────────────────────────────
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loadingP, setLoadingP] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // ── Toast (Simulated via alert for now, can be replaced by real toast) ──
  const onToast = (type: 'success' | 'error', msg: string) => {
    alert(msg);
  };

  // ─── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchEvent = useCallback(async () => {
    setLoadingEvent(true);
    try {
      const data = await getEventApi(eventId);
      setEvent(data);
    } catch {
      alert('Gagal memuat detail ujian.');
      router.push('/dashboard/events');
    } finally {
      setLoadingEvent(false);
    }
  }, [eventId, router]);

  const fetchEventQuestions = useCallback(async () => {
    setLoadingQ(true);
    try {
      const res = await listEventQuestionsApi(eventId, 1, 500);
      setEventQuestions(res.data);
    } finally {
      setLoadingQ(false);
    }
  }, [eventId]);

  const fetchParticipants = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await listEventParticipantsApi(eventId, 1, 500);
      setParticipants(res.data);
    } finally {
      setLoadingP(false);
    }
  }, [eventId]);

  const fetchBankQuestions = useCallback(async () => {
    setPickerLoading(true);
    try {
      const res = await listQuestionsApi(1, 100, pickerSearch);
      const addedIds = new Set(eventQuestions.map((q) => q.id));
      setBankQuestions(res.data.filter((q) => !addedIds.has(q.id)));
    } finally {
      setPickerLoading(false);
    }
  }, [pickerSearch, eventQuestions]);

  const fetchCategories = useCallback(async () => {
    const res = await listCategoriesApi(1, 100);
    setCategories(res.data);
  }, []);

  useEffect(() => {
    fetchEvent();
    fetchEventQuestions();
    fetchParticipants();
    fetchCategories();
  }, [fetchEvent, fetchEventQuestions, fetchParticipants, fetchCategories]);

  useEffect(() => {
    // Only fetch bank questions if on questions tab
    if (tab === 'questions') fetchBankQuestions();
  }, [tab, pickerSearch, fetchBankQuestions]);

  // ─── Question handlers ──────────────────────────────────────────────────────
  const handleAddQuestion = async (questionId: string) => {
    setAddingQId(questionId);
    try {
      await addEventQuestionApi(eventId, { question_id: questionId });
      // Remove locally from bank to give instant feel
      setBankQuestions(prev => prev.filter(q => q.id !== questionId));
      await fetchEventQuestions(); // refresh list
    } catch {
      onToast('error', 'Gagal menambahkan soal.');
    } finally {
      setAddingQId(null);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    try {
      await removeEventQuestionApi(eventId, questionId);
      await fetchEventQuestions();
    } catch {
      onToast('error', 'Gagal menghapus soal.');
    }
  };

  const handleRandomAdd = async () => {
    setRandomLoading(true);
    try {
      await addRandomEventQuestionsApi(eventId, {
        category_id: randomForm.category_id ? Number(randomForm.category_id) : null,
        amount: Number(randomForm.amount),
      });
      onToast('success', `${randomForm.amount} soal acak berhasil ditambahkan.`);
      await fetchEventQuestions();
    } catch {
      onToast('error', 'Gagal mengambil soal acak — jumlah soal mungkin kurang dari permintaan.');
    } finally {
      setRandomLoading(false);
    }
  };

  // ─── Participant handlers ────────────────────────────────────────────────────
  const handleApprove = async (approvalId: string) => {
    setApprovingId(approvalId);
    try {
      await approveParticipantApi(eventId, approvalId);
      await fetchParticipants();
    } catch {
      onToast('error', 'Gagal menyetujui peserta.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRevoke = async (approvalId: string) => {
    setRevokingId(approvalId);
    try {
      await revokeParticipantApi(eventId, approvalId);
      await fetchParticipants();
    } catch {
      onToast('error', 'Gagal membatalkan persetujuan peserta.');
    } finally {
      setRevokingId(null);
    }
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  const handleExport = (format: 'excel' | 'pdf') => {
    window.open(getExportUrl(eventId, format), '_blank');
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loadingEvent) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} className="text-amber-600" />
      </div>
    );
  }

  if (!event) return null;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-gray-50 -m-6 rounded-tl-xl overflow-hidden">
      {/* ─── Header ─── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 z-10 shadow-sm relative">
        <button
          onClick={() => router.push('/dashboard/events')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors font-medium mb-3 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar Ujian
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{event.name}</h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                <Clock size={14} className="text-gray-400" />
                <span className="font-semibold">{fmtDate(event.start_time)}</span> <span className="text-gray-400">—</span> <span className="font-semibold">{fmtDate(event.end_time)}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-lg font-semibold">
                ⏱ {event.duration_minutes} menit
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-semibold">
                <Trophy size={14} /> Batas Lulus {event.passing_grade}%
              </span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            {([
              { key: 'questions', label: 'Kelola Soal', icon: BookOpen, count: eventQuestions.length },
              { key: 'participants', label: 'Peserta', icon: Users, count: participants.length },
            ] as const).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                  tab === key
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                <Icon size={16} />
                {label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  tab === key ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Workspace ─── */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Tab: Questions (Split Pane) */}
        <div className={`flex-1 flex overflow-hidden transition-all duration-300 ${tab === 'questions' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 hidden'}`}>
          {/* Left Pane: Current Questions */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Soal Ujian Ini
                <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{eventQuestions.length}</span>
              </h2>
              
              {loadingQ ? (
                <div className="flex justify-center py-12"><Spinner size={28} className="text-amber-600" /></div>
              ) : eventQuestions.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl border-dashed">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">Belum Ada Soal</h3>
                  <p className="text-sm text-gray-500">Pilih soal dari panel Bank Soal di sebelah kanan untuk menambahkannya ke ujian ini.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {eventQuestions.map((q, i) => (
                    <li
                      key={q.id}
                      className="flex items-start gap-4 p-4 bg-white shadow-sm rounded-2xl border border-gray-100 group transition-all hover:shadow-md hover:border-amber-200"
                    >
                      <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 text-sm font-black flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm font-medium leading-relaxed">{q.question_text}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 font-semibold text-xs hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-200"
                        title="Hapus dari ujian"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Pane: Sticky Bank Picker */}
          <div className="w-[400px] border-l border-gray-200 bg-white flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 to-white">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Search size={16} className="text-indigo-500" /> Bank Soal
              </h3>
              
              {/* Random Pull Accordion */}
              <div className="bg-white border border-indigo-100 rounded-xl p-4 mb-5 shadow-sm">
                <p className="text-xs text-indigo-800 font-bold mb-3 uppercase tracking-wider">Tarik Soal Acak</p>
                <div className="flex flex-col gap-3">
                  <select
                    value={randomForm.category_id}
                    onChange={(e) => setRandomForm((s) => ({ ...s, category_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all font-medium"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Jumlah"
                      value={randomForm.amount}
                      onChange={(e) => setRandomForm((s) => ({ ...s, amount: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white font-medium"
                    />
                    <button
                      onClick={handleRandomAdd}
                      disabled={randomLoading}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      {randomLoading ? <Spinner size={14} className="text-white" /> : <Shuffle size={14} />} Tarik
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari soal spesifik..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-400/30 bg-gray-50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
              {pickerLoading ? (
                <div className="flex justify-center py-8"><Spinner size={22} className="text-amber-600" /></div>
              ) : bankQuestions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">Tidak ada soal tersisa di Bank Soal.</p>
              ) : (
                <ul className="space-y-2">
                  {bankQuestions.map((q) => (
                    <li
                      key={q.id}
                      className="flex flex-col gap-3 p-3.5 bg-white rounded-xl border border-gray-100 hover:border-amber-300 hover:shadow-md transition-all group cursor-pointer"
                      onClick={() => handleAddQuestion(q.id)}
                    >
                      <p className="text-gray-700 text-sm leading-snug line-clamp-3">
                        {q.question_text}
                      </p>
                      <button
                        disabled={addingQId === q.id}
                        className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold group-hover:bg-amber-600 group-hover:text-white transition-all disabled:opacity-50"
                      >
                        {addingQId === q.id ? <Spinner size={12} /> : <Plus size={12} />} Tambah
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Tab: Participants */}
        <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${tab === 'participants' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 hidden'}`}>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-all"
              >
                <Download size={16} /> Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-all"
              >
                <Download size={16} /> Export PDF
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {loadingP ? (
                <div className="flex justify-center py-12"><Spinner size={28} className="text-amber-600" /></div>
              ) : participants.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">Belum Ada Peserta</h3>
                  <p className="text-sm text-gray-500">Pendaftar ujian ini akan muncul di sini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Peserta</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nilai</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hasil</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {participants.map((p) => (
                        <tr key={p.user_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-900 text-sm mb-0.5">{p.full_name}</p>
                              <p className="text-gray-500 text-xs font-mono bg-gray-100 w-fit px-1.5 py-0.5 rounded">{p.username}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-black text-gray-900 text-base">
                              {p.is_completed ? p.score.toFixed(1) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {p.is_completed ? (
                              p.is_passed ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-bold">
                                  <CheckCircle size={14} /> Lulus
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-lg text-xs font-bold">
                                  <XCircle size={14} /> Tidak Lulus
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs font-medium italic">Belum selesai</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status.toLowerCase() === 'pending' && (
                                <button
                                  onClick={() => handleApprove(p.user_id)}
                                  disabled={approvingId === p.user_id}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                  {approvingId === p.user_id ? <Spinner size={14} /> : <CheckCircle size={14} />} Approve
                                </button>
                              )}
                              
                              {(p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'approved') && (
                                <button
                                  onClick={() => handleRevoke(p.user_id)}
                                  disabled={revokingId === p.user_id}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-red-600 border-2 border-red-100 text-xs font-bold hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                                >
                                  {revokingId === p.user_id ? <Spinner size={14} /> : <XCircle size={14} />} Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
