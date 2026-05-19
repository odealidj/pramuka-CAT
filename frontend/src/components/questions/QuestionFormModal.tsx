'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import type {
  Question,
  CreateQuestionRequest,
  Category,
  CorrectAnswer,
} from '@/types/auth';

// ============================================================
// Zod Schema
// ============================================================
const schema = z.object({
  category_id: z.string().optional(),
  question_text: z.string().min(5, 'Teks soal minimal 5 karakter'),
  option_a: z.string().min(1, 'Pilihan A wajib diisi'),
  option_b: z.string().min(1, 'Pilihan B wajib diisi'),
  option_c: z.string().min(1, 'Pilihan C wajib diisi'),
  option_d: z.string().min(1, 'Pilihan D wajib diisi'),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  weight: z.string().refine((v) => {
    const n = Number(v);
    return !isNaN(n) && n >= 1;
  }, 'Bobot minimal 1').refine((v) => {
    const n = Number(v);
    return n <= 100;
  }, 'Bobot maksimal 100'),
});

type FormValues = z.infer<typeof schema>;

// ============================================================
// Props
// ============================================================
interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  question?: Question | null;
  categories: Category[];
  onSubmit: (data: CreateQuestionRequest) => Promise<void>;
  apiError?: string | null;
}

// ============================================================
// Answer Options Config
// ============================================================
const answerOptions: { key: CorrectAnswer; label: string; color: string }[] = [
  { key: 'A', label: 'A', color: 'bg-blue-500' },
  { key: 'B', label: 'B', color: 'bg-emerald-500' },
  { key: 'C', label: 'C', color: 'bg-amber-500' },
  { key: 'D', label: 'D', color: 'bg-rose-500' },
];

// ============================================================
// Helper: Field wrapper
// ============================================================
function Field({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-semibold mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasErr?: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all ${
    hasErr
      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
      : 'border-gray-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
  }`;

// ============================================================
// Main Component
// ============================================================
export default function QuestionFormModal({
  isOpen,
  onClose,
  mode,
  question,
  categories,
  onSubmit,
  apiError,
}: QuestionFormModalProps) {
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: '',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      weight: '1',
    },
  });

  const correctAnswer = watch('correct_answer');

  useEffect(() => {
    if (isEdit && question) {
      reset({
        category_id: question.category_id != null ? String(question.category_id) : '',
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer,
        weight: String(question.weight),
      });
    } else if (!isEdit) {
      reset({
        category_id: '',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        weight: '1',
      });
    }
  }, [isEdit, question, reset, isOpen]);

  const handleFormSubmit = async (values: FormValues) => {
    const payload: CreateQuestionRequest = {
      category_id: values.category_id ? Number(values.category_id) : null,
      question_text: values.question_text,
      option_a: values.option_a,
      option_b: values.option_b,
      option_c: values.option_c,
      option_d: values.option_d,
      correct_answer: values.correct_answer,
      weight: Number(values.weight),
    };
    await onSubmit(payload);
  };

  const optionFields: { key: CorrectAnswer; field: 'option_a' | 'option_b' | 'option_c' | 'option_d' }[] = [
    { key: 'A', field: 'option_a' },
    { key: 'B', field: 'option_b' },
    { key: 'C', field: 'option_c' },
    { key: 'D', field: 'option_d' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Soal' : 'Tambah Soal Baru'}
      size="lg"
    >
      {apiError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>

        {/* Row: Category + Weight */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kategori" error={errors.category_id?.message}>
            <select
              {...register('category_id')}
              disabled={isSubmitting}
              className={`${inputCls()} appearance-none cursor-pointer`}
            >
              <option value="">— Tanpa Kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bobot Soal" error={errors.weight?.message} required>
            <input
              type="number"
              min={1}
              max={100}
              placeholder="1 – 100"
              disabled={isSubmitting}
              {...register('weight')}
              className={inputCls(!!errors.weight)}
            />
          </Field>
        </div>

        {/* Question Text */}
        <Field label="Teks Soal / Pertanyaan" error={errors.question_text?.message} required>
          <textarea
            rows={3}
            placeholder="Tulis pertanyaan di sini..."
            disabled={isSubmitting}
            {...register('question_text')}
            className={`${inputCls(!!errors.question_text)} resize-none`}
          />
        </Field>

        {/* Answer Options — with correct answer selector */}
        <div>
          <p className="text-gray-700 text-sm font-semibold mb-2">
            Pilihan Jawaban <span className="text-red-500">*</span>
            <span className="ml-2 text-gray-400 font-normal text-xs">
              (klik ikon ✓ untuk menandai jawaban benar)
            </span>
          </p>
          <div className="space-y-2">
            {optionFields.map(({ key, field }) => {
              const isCorrect = correctAnswer === key;
              const optCfg = answerOptions.find((o) => o.key === key)!;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50/60'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Letter badge */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${optCfg.color}`}
                  >
                    {key}
                  </div>
                  {/* Input */}
                  <input
                    type="text"
                    placeholder={`Pilihan ${key}...`}
                    disabled={isSubmitting}
                    {...register(field)}
                    className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder:text-gray-400"
                  />
                  {/* Correct answer toggle */}
                  <button
                    type="button"
                    onClick={() => setValue('correct_answer', key)}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                      isCorrect
                        ? 'text-emerald-600 bg-emerald-100'
                        : 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50'
                    }`}
                    title={`Jadikan pilihan ${key} sebagai jawaban benar`}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
          {/* Show validation errors for options */}
          {(errors.option_a || errors.option_b || errors.option_c || errors.option_d) && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle size={11} /> Semua pilihan jawaban wajib diisi
            </p>
          )}
          {/* Hidden input for correct_answer registration */}
          <input type="hidden" {...register('correct_answer')} />
          {/* Jawaban benar indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Jawaban benar:{' '}
            <span className="font-bold">
              Pilihan {correctAnswer}
            </span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white text-sm font-semibold hover:from-[#5C3010] hover:to-[#7C4318] transition-all disabled:opacity-70 shadow-sm shadow-amber-900/20"
          >
            {isSubmitting && <Spinner size={14} className="text-white" />}
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Soal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
