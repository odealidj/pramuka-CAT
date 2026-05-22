'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, BookOpen, Award } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { reviewParticipantAnswersApi } from '@/services/exam.service';
import type { EventParticipant, UserAnswerDetail } from '@/types/auth';

type AnswerKey = 'A' | 'B' | 'C' | 'D';

const optionKeys: AnswerKey[] = ['A', 'B', 'C', 'D'];
const optionLabel: Record<AnswerKey, string> = {
  A: 'option_a',
  B: 'option_b',
  C: 'option_c',
  D: 'option_d',
};

interface AnswerReviewDrawerProps {
  participant: EventParticipant | null;
  eventName: string;
  passingGrade: number;
  onClose: () => void;
}

export default function AnswerReviewDrawer({
  participant,
  eventName,
  passingGrade,
  onClose,
}: AnswerReviewDrawerProps) {
  const [answers, setAnswers] = useState<UserAnswerDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!participant) { setAnswers([]); return; }
    setError(null);
    setIsLoading(true);
    // approval_id == user_id dari EventParticipant (sesuai handler)
    reviewParticipantAnswersApi(participant.user_id)
      .then(setAnswers)
      .catch(() => setError('Gagal memuat data jawaban peserta.'))
      .finally(() => setIsLoading(false));
  }, [participant]);

  if (!participant) return null;

  const correctCount = answers.filter((a) => a.is_correct).length;
  const totalWeight = answers.reduce((sum, a) => sum + a.weight, 0);
  const earnedWeight = answers.filter((a) => a.is_correct).reduce((sum, a) => sum + a.weight, 0);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">{eventName}</p>
              <h2 className="text-gray-900 font-bold text-base">
                Review Jawaban — {participant.full_name}
              </h2>
              <p className="text-gray-400 text-xs font-mono mt-0.5">@{participant.username}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Score summary */}
          {participant.is_completed && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <p className="text-gray-400 text-xs">Skor Akhir</p>
                <p
                  className={`text-xl font-bold mt-0.5 ${
                    participant.is_passed ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {participant.score.toFixed(1)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <p className="text-gray-400 text-xs">Benar / Total</p>
                <p className="text-xl font-bold text-gray-800 mt-0.5">
                  {correctCount} / {answers.length}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <p className="text-gray-400 text-xs">Status</p>
                <p
                  className={`text-sm font-bold mt-1 flex items-center justify-center gap-1 ${
                    participant.is_passed ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {participant.is_passed ? (
                    <><Award size={14} /> Lulus</>
                  ) : (
                    <><XCircle size={14} /> Tidak Lulus</>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Spinner size={24} className="text-indigo-500" />
              <span className="text-sm">Memuat detail jawaban...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-400">
              <XCircle size={32} />
              <p className="text-sm">{error}</p>
            </div>
          ) : answers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <BookOpen size={32} className="text-gray-200" />
              <p className="text-sm">
                {participant.is_completed
                  ? 'Tidak ada data jawaban tersedia.'
                  : 'Peserta belum menyelesaikan ujian.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((ans, idx) => (
                <div
                  key={ans.answer_id}
                  className={`rounded-2xl border p-4 ${
                    ans.is_correct
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        ans.is_correct
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-400 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm font-medium leading-snug">
                        {ans.question_text}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">Bobot: {ans.weight}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        ans.is_correct
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {ans.is_correct ? (
                        <><CheckCircle2 size={11} /> Benar</>
                      ) : (
                        <><XCircle size={11} /> Salah</>
                      )}
                    </span>
                  </div>

                  {/* Answer options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-10">
                    {optionKeys.map((key) => {
                      const text = ans[optionLabel[key] as keyof UserAnswerDetail] as string;
                      const isSelected = ans.selected_answer === key;
                      const isCorrect = ans.correct_answer === key;

                      let cls = 'border-gray-100 bg-white text-gray-500';
                      if (isCorrect && isSelected) cls = 'border-emerald-400 bg-emerald-100 text-emerald-800 font-semibold';
                      else if (isCorrect) cls = 'border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold';
                      else if (isSelected) cls = 'border-red-300 bg-red-50 text-red-600';

                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-all ${cls}`}
                        >
                          <span
                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-500 text-white'
                                : isSelected
                                ? 'bg-red-400 text-white'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {key}
                          </span>
                          <span className="flex-1 leading-snug">{text}</span>
                          {isCorrect && <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />}
                          {isSelected && !isCorrect && <XCircle size={12} className="text-red-400 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Summary footer */}
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Total Bobot: <strong className="text-gray-800">{earnedWeight}</strong> / {totalWeight}
                </span>
                <span className="text-gray-500">
                  Batas Lulus: <strong className="text-gray-800">{passingGrade}%</strong>
                </span>
                <span
                  className={`font-bold ${
                    participant.is_passed ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  Skor: {participant.score.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
