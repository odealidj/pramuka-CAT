'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Tag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import QuestionFormModal from '@/components/questions/QuestionFormModal';
import CategoryManagerModal from '@/components/questions/CategoryManagerModal';
import {
  listQuestionsApi,
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
} from '@/services/question.service';
import { listCategoriesApi } from '@/services/category.service';
import type {
  Question,
  Category,
  CreateQuestionRequest,
  PaginationMeta,
  ApiErrorResponse,
  CorrectAnswer,
} from '@/types/auth';

// ============================================================
// Helpers
// ============================================================
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const optionBadgeColor: Record<CorrectAnswer, string> = {
  A: 'bg-blue-100 text-blue-700 border-blue-200',
  B: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-rose-100 text-rose-700 border-rose-200',
};

// ============================================================
// Question Row — expandable for answer preview
// ============================================================
function QuestionRow({
  question,
  index,
  category,
  onEdit,
  onDelete,
}: {
  question: Question;
  index: number;
  category?: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const options: { key: CorrectAnswer; text: string }[] = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ];

  return (
    <>
      {/* Main row */}
      <tr className="hover:bg-gray-50/60 transition-colors group">
        <td className="px-5 py-3.5 text-gray-400 text-xs align-top">{index}</td>
        <td className="px-5 py-3.5 align-top">
          <div className="flex flex-col gap-1.5">
            <p className="text-gray-900 text-sm font-medium leading-snug line-clamp-2">
              {question.question_text}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {category ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Tag size={10} />
                  {category.name}
                </span>
              ) : (
                <span className="text-xs text-gray-300">Tanpa kategori</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5 align-top hidden md:table-cell">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${
              optionBadgeColor[question.correct_answer]
            }`}
          >
            {question.correct_answer}
          </span>
        </td>
        <td className="px-5 py-3.5 align-top hidden sm:table-cell">
          <span className="text-gray-700 text-sm font-semibold">{question.weight}</span>
        </td>
        <td className="px-5 py-3.5 align-top text-gray-400 text-xs hidden lg:table-cell">
          {formatDate(question.created_at)}
        </td>
        <td className="px-5 py-3.5 align-top">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
              title={expanded ? 'Tutup preview' : 'Lihat pilihan jawaban'}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-all"
              title="Edit soal"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Hapus soal"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable Answer Preview */}
      {expanded && (
        <tr className="bg-gray-50/80">
          <td />
          <td colSpan={5} className="px-5 pb-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map(({ key, text }) => {
                const isCorrect = key === question.correct_answer;
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm ${
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isCorrect ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {key}
                    </span>
                    <span className="flex-1 leading-snug">{text}</span>
                    {isCorrect && (
                      <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [formModal, setFormModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    question: Question | null;
  }>({ open: false, mode: 'create', question: null });

  const [categoryModal, setCategoryModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    question: Question | null;
    isLoading: boolean;
  }>({ open: false, question: null, isLoading: false });

  const [formApiError, setFormApiError] = useState<string | null>(null);
  const { toasts, toast, dismiss } = useToast();

  // Category map for lookup in table
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  // ============================================================
  // Fetch
  // ============================================================
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listQuestionsApi(page, 10, search);
      setQuestions(res.data);
      setMeta(res.meta);
    } catch {
      toast('error', 'Gagal memuat data soal.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCategories = useCallback(async () => {
    try {
      const res = await listCategoriesApi(1, 100);
      setCategories(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setSearch(searchInput); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ============================================================
  // CRUD Handlers
  // ============================================================
  const handleCreate = async (data: CreateQuestionRequest) => {
    setFormApiError(null);
    try {
      await createQuestionApi(data);
      toast('success', 'Soal baru berhasil ditambahkan.');
      setFormModal({ open: false, mode: 'create', question: null });
      fetchQuestions();
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message ?? 'Gagal menambahkan soal.'
        : 'Terjadi kesalahan.';
      setFormApiError(msg);
      throw err;
    }
  };

  const handleUpdate = async (data: CreateQuestionRequest) => {
    if (!formModal.question) return;
    setFormApiError(null);
    try {
      await updateQuestionApi(formModal.question.id, data);
      toast('success', 'Soal berhasil diperbarui.');
      setFormModal({ open: false, mode: 'edit', question: null });
      fetchQuestions();
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message ?? 'Gagal memperbarui soal.'
        : 'Terjadi kesalahan.';
      setFormApiError(msg);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.question) return;
    setDeleteDialog((d) => ({ ...d, isLoading: true }));
    try {
      await deleteQuestionApi(deleteDialog.question.id);
      toast('success', 'Soal berhasil dihapus.');
      setDeleteDialog({ open: false, question: null, isLoading: false });
      fetchQuestions();
    } catch {
      toast('error', 'Gagal menghapus soal.');
      setDeleteDialog((d) => ({ ...d, isLoading: false }));
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <BookOpen size={22} className="text-amber-700" />
            Bank Soal
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Kelola daftar soal ujian beserta kategorinya
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-50 transition-all"
          >
            <Tag size={15} />
            Kategori
          </button>
          <button
            onClick={() => {
              setFormApiError(null);
              setFormModal({ open: true, mode: 'create', question: null });
            }}
            id="btn-add-question"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white text-sm font-semibold rounded-xl shadow-sm shadow-amber-900/20 hover:from-[#5C3010] hover:to-[#7C4318] transition-all"
          >
            <Plus size={15} />
            Tambah Soal
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium">Total Soal</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{meta?.total_records ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium">Kategori</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{categories.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-gray-400 text-xs font-medium">Halaman</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            {meta ? `${page} / ${meta.total_pages}` : '—'}
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-300 focus-within:bg-white transition-all">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari teks soal..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
              id="search-questions"
            />
          </div>
          <button
            onClick={fetchQuestions}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">No</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Soal & Kategori</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Jawaban</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Bobot</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Dibuat</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Spinner size={24} className="text-amber-600" />
                      <span className="text-sm">Memuat data soal...</span>
                    </div>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <BookOpen size={36} className="text-gray-200" />
                      <p className="text-sm font-medium text-gray-500">
                        {search ? `Tidak ada soal dengan kata kunci "${search}"` : 'Belum ada soal dalam bank soal'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q, idx) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    index={(page - 1) * 10 + idx + 1}
                    category={q.category_id != null ? categoryMap[q.category_id] : undefined}
                    onEdit={() => {
                      setFormApiError(null);
                      setFormModal({ open: true, mode: 'edit', question: q });
                    }}
                    onDelete={() =>
                      setDeleteDialog({ open: true, question: q, isLoading: false })
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
            <p className="text-gray-400 text-xs">
              Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, meta.total_records)} dari{' '}
              {meta.total_records} soal
            </p>
            <Pagination
              page={page}
              totalPages={meta.total_pages}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <QuestionFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal((s) => ({ ...s, open: false }))}
        mode={formModal.mode}
        question={formModal.question}
        categories={categories}
        onSubmit={formModal.mode === 'create' ? handleCreate : handleUpdate}
        apiError={formApiError}
      />

      <CategoryManagerModal
        isOpen={categoryModal}
        onClose={() => setCategoryModal(false)}
        onCategoriesChanged={fetchCategories}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, question: null, isLoading: false })}
        onConfirm={handleDelete}
        title="Hapus Soal"
        message={`Hapus soal ini secara permanen? "${deleteDialog.question?.question_text.slice(0, 60)}..."`}
        isLoading={deleteDialog.isLoading}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
