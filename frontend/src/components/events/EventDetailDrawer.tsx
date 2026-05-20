'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  X,
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
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import {
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
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = 'questions' | 'participants';

interface EventDetailDrawerProps {
  event: Event | null;
  onClose: () => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}

export default function EventDetailDrawer({
  event,
  onClose,
  onToast,
}: EventDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>('questions');

  // ── Questions state ────────────────────────────────────────────────────────
  const [eventQuestions, setEventQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);

  // For "add manual" picker
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [addingQId, setAddingQId] = useState<string | null>(null);

  // For random pull
  const [categories, setCategories] = useState<Category[]>([]);
  const [randomForm, setRandomForm] = useState({ category_id: '', amount: '5' });
  const [randomLoading, setRandomLoading] = useState(false);
  const [showRandom, setShowRandom] = useState(false);

  // ── Participants state ─────────────────────────────────────────────────────
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loadingP, setLoadingP] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // ─── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchEventQuestions = useCallback(async () => {
    if (!event) return;
    setLoadingQ(true);
    try {
      const res = await listEventQuestionsApi(event.id, 1, 100);
      setEventQuestions(res.data);
    } finally {
      setLoadingQ(false);
    }
  }, [event]);

  const fetchParticipants = useCallback(async () => {
    if (!event) return;
    setLoadingP(true);
    try {
      const res = await listEventParticipantsApi(event.id, 1, 100);
      setParticipants(res.data);
    } finally {
      setLoadingP(false);
    }
  }, [event]);

  const fetchBankQuestions = useCallback(async () => {
    setPickerLoading(true);
    try {
      const res = await listQuestionsApi(1, 50, pickerSearch);
      // Exclude already added
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
    if (!event) return;
    fetchEventQuestions();
    fetchParticipants();
    fetchCategories();
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showPicker) fetchBankQuestions();
  }, [showPicker, pickerSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Question handlers ──────────────────────────────────────────────────────
  const handleAddQuestion = async (questionId: string) => {
    if (!event) return;
    setAddingQId(questionId);
    try {
      await addEventQuestionApi(event.id, { question_id: questionId });
      onToast('success', 'Soal berhasil ditambahkan.');
      await fetchEventQuestions();
    } catch {
      onToast('error', 'Gagal menambahkan soal.');
    } finally {
      setAddingQId(null);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!event) return;
    try {
      await removeEventQuestionApi(event.id, questionId);
      onToast('success', 'Soal dihapus dari ujian.');
      await fetchEventQuestions();
    } catch {
      onToast('error', 'Gagal menghapus soal.');
    }
  };

  const handleRandomAdd = async () => {
    if (!event) return;
    setRandomLoading(true);
    try {
      await addRandomEventQuestionsApi(event.id, {
        category_id: randomForm.category_id ? Number(randomForm.category_id) : null,
        amount: Number(randomForm.amount),
      });
      onToast('success', `${randomForm.amount} soal acak berhasil ditambahkan.`);
      setShowRandom(false);
      await fetchEventQuestions();
    } catch {
      onToast('error', 'Gagal mengambil soal acak — jumlah soal mungkin kurang dari permintaan.');
    } finally {
      setRandomLoading(false);
    }
  };

  // ─── Participant handlers ────────────────────────────────────────────────────
  const handleApprove = async (approvalId: string) => {
    if (!event) return;
    setApprovingId(approvalId);
    try {
      await approveParticipantApi(event.id, approvalId);
      onToast('success', 'Peserta berhasil disetujui.');
      await fetchParticipants();
    } catch {
      onToast('error', 'Gagal menyetujui peserta.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRevoke = async (approvalId: string) => {
    if (!event) return;
    setRevokingId(approvalId);
    try {
      await revokeParticipantApi(event.id, approvalId);
      onToast('success', 'Persetujuan peserta berhasil dibatalkan (Revoked).');
      await fetchParticipants();
    } catch {
      onToast('error', 'Gagal membatalkan persetujuan peserta.');
    } finally {
      setRevokingId(null);
    }
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  const handleExport = (format: 'excel' | 'pdf') => {
    if (!event) return;
    window.open(getExportUrl(event.id, format), '_blank');
  };

  // ─── Render: not open ────────────────────────────────────────────────────────
  if (!event) return null;

  // Format helpers
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
          <div>
            <h2 className="text-gray-900 font-bold text-base leading-tight">{event.name}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {fmtDate(event.start_time)} — {fmtDate(event.end_time)}
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                ⏱ {event.duration_minutes} menit
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                🏆 KKM {event.passing_grade}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 gap-1">
          {([
            { key: 'questions', label: 'Soal Ujian', icon: BookOpen, count: eventQuestions.length },
            { key: 'participants', label: 'Peserta', icon: Users, count: participants.length },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === key
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={14} />
              {label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === key ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Tab: Questions ──────────────────────────────────────────────── */}
          {tab === 'questions' && (
            <div className="p-5 space-y-4">
              {/* Action bar */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setShowPicker((v) => !v); setShowRandom(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-all"
                >
                  <Plus size={14} /> Pilih Soal Manual
                </button>
                <button
                  onClick={() => { setShowRandom((v) => !v); setShowPicker(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-300 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-all"
                >
                  <Shuffle size={14} /> Soal Acak
                </button>
              </div>

              {/* Manual Picker Panel */}
              {showPicker && (
                <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/30 space-y-3">
                  <p className="text-gray-700 text-sm font-semibold">Pilih dari Bank Soal</p>
                  <input
                    type="text"
                    placeholder="Cari soal..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-400/30 bg-white"
                  />
                  {pickerLoading ? (
                    <div className="flex justify-center py-4"><Spinner size={18} className="text-amber-600" /></div>
                  ) : bankQuestions.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-3">Tidak ada soal tersedia</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-52 overflow-y-auto">
                      {bankQuestions.map((q) => (
                        <li
                          key={q.id}
                          className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all"
                        >
                          <p className="flex-1 text-gray-700 text-xs leading-snug line-clamp-2">
                            {q.question_text}
                          </p>
                          <button
                            onClick={() => handleAddQuestion(q.id)}
                            disabled={addingQId === q.id}
                            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all disabled:opacity-50"
                          >
                            {addingQId === q.id ? <Spinner size={11} className="text-white" /> : <Plus size={11} />}
                            Tambah
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Random Panel */}
              {showRandom && (
                <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/30 space-y-3">
                  <p className="text-gray-700 text-sm font-semibold">Tarik Soal Acak</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-semibold block mb-1">Kategori</label>
                      <select
                        value={randomForm.category_id}
                        onChange={(e) => setRandomForm((s) => ({ ...s, category_id: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="">— Semua Kategori —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-semibold block mb-1">Jumlah Soal</label>
                      <input
                        type="number"
                        min={1}
                        value={randomForm.amount}
                        onChange={(e) => setRandomForm((s) => ({ ...s, amount: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-start gap-1.5 flex-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                      Soal yang sudah ada di ujian ini tidak akan dipilih ulang.
                    </div>
                    <button
                      onClick={handleRandomAdd}
                      disabled={randomLoading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {randomLoading ? <Spinner size={13} className="text-white" /> : <Shuffle size={13} />}
                      Tarik
                    </button>
                  </div>
                </div>
              )}

              {/* Question list */}
              {loadingQ ? (
                <div className="flex justify-center py-8"><Spinner size={22} className="text-amber-600" /></div>
              ) : eventQuestions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <BookOpen size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Belum ada soal. Gunakan tombol di atas untuk menambahkan.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {eventQuestions.map((q, i) => (
                    <li
                      key={q.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group"
                    >
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-gray-700 text-sm leading-snug">{q.question_text}</p>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Hapus dari ujian"
                      >
                        <XCircle size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Tab: Participants ───────────────────────────────────────────── */}
          {tab === 'participants' && (
            <div className="p-5 space-y-4">
              {/* Export buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-all"
                >
                  <Download size={14} /> Export Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all"
                >
                  <Download size={14} /> Export PDF
                </button>
              </div>

              {/* Participants list */}
              {loadingP ? (
                <div className="flex justify-center py-8"><Spinner size={22} className="text-amber-600" /></div>
              ) : participants.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Belum ada peserta yang mendaftar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 rounded-xl">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Peserta</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Nilai</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Hasil</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {participants.map((p) => (
                        <tr key={p.user_id} className="hover:bg-gray-50/60">
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{p.full_name}</p>
                              <p className="text-gray-400 text-xs font-mono">{p.username}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-3 py-3 font-bold text-gray-800">
                            {p.is_completed ? p.score.toFixed(1) : '—'}
                          </td>
                          <td className="px-3 py-3">
                            {p.is_completed ? (
                              p.is_passed ? (
                                <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                  <CheckCircle size={12} /> Lulus
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                                  <XCircle size={12} /> Tidak Lulus
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs">Belum selesai</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status.toLowerCase() === 'pending' && (
                                <button
                                  onClick={() => handleApprove(p.user_id)}
                                  disabled={approvingId === p.user_id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                  {approvingId === p.user_id ? (
                                    <Spinner size={11} className="text-white" />
                                  ) : (
                                    <CheckCircle size={11} />
                                  )}
                                  Approve
                                </button>
                              )}
                              
                              {(p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'approved') && (
                                <button
                                  onClick={() => handleRevoke(p.user_id)}
                                  disabled={revokingId === p.user_id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-200 transition-all disabled:opacity-50"
                                >
                                  {revokingId === p.user_id ? (
                                    <Spinner size={11} className="text-red-700" />
                                  ) : (
                                    <XCircle size={11} />
                                  )}
                                  Revoke
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
          )}
        </div>
      </div>
    </div>
  );
}
