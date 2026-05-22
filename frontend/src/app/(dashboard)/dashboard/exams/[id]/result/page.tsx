'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getExamResultParticipantApi } from '@/services/exam.service';
import type { UserAnswerDetail } from '@/types/auth';
import { ChevronLeft, CheckCircle2, XCircle, Award, Frown, Clock, Trophy } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

export default function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [results, setResults] = useState<UserAnswerDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    // Hanya peserta yang boleh mengakses halaman ini
    if (user.role !== 'peserta') {
      router.replace('/dashboard');
      return;
    }

    const fetchResult = async () => {
      try {
        const data = await getExamResultParticipantApi(resolvedParams.id);
        setResults(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Gagal memuat hasil ujian.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [resolvedParams.id, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size={40} className="text-indigo-600" />
        <p className="text-gray-500 font-medium">Memuat hasil ujian...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-2">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Oops!</h2>
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => router.push('/dashboard/events')}
          className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // Calculate summary metrics
  const totalQuestions = results.length;
  let correctCount = 0;
  let totalWeight = 0;
  let achievedWeight = 0;

  results.forEach(item => {
    totalWeight += item.weight;
    if (item.is_correct) {
      correctCount++;
      achievedWeight += item.weight;
    }
  });

  const rawScore = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Back Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/events')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hasil & Pembahasan</h1>
          <p className="text-gray-500 text-sm">Review kembali hasil pekerjaan ujian Anda</p>
        </div>
      </div>

      {/* Summary Score Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Trophy size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-gray-500 font-medium">Skor Akhir Anda</h2>
            <div className="text-5xl font-black text-gray-900 tracking-tighter">
              {rawScore.toFixed(2)}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700">
                <CheckCircle2 size={16} className="text-emerald-500" />
                {correctCount} Benar
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700">
                <XCircle size={16} className="text-red-500" />
                {totalQuestions - correctCount} Salah
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg px-1">Pembahasan Soal</h3>
        
        {results.map((item, idx) => {
          const isUserCorrect = item.is_correct;
          const hasAnswered = item.selected_answer !== '';
          
          return (
            <div key={item.answer_id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isUserCorrect ? 'border-emerald-200 shadow-emerald-50' : 'border-red-200 shadow-red-50'}`}>
              <div className={`px-5 py-3 border-b flex justify-between items-center ${isUserCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <span className={`font-bold text-sm ${isUserCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                  Soal Nomor {idx + 1}
                </span>
                <div className={`flex items-center gap-1.5 text-sm font-bold ${isUserCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isUserCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {isUserCorrect ? 'Benar' : 'Salah'}
                  <span className="opacity-50 mx-1">•</span>
                  Bobot: {item.weight}
                </div>
              </div>
              
              <div className="p-5 space-y-6">
                <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                  {item.question_text}
                </p>

                <div className="grid gap-3">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const text = item[`option_${opt.toLowerCase()}` as keyof UserAnswerDetail];
                    if (!text) return null;

                    const isSelected = item.selected_answer === opt;
                    const isCorrectOption = item.correct_answer === opt;

                    // Determine option styling
                    let bgClass = 'bg-gray-50 border-gray-200';
                    let textClass = 'text-gray-700';
                    let icon = null;

                    if (isCorrectOption) {
                      bgClass = 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300';
                      textClass = 'text-emerald-900 font-semibold';
                      icon = <CheckCircle2 size={18} className="text-emerald-600" />;
                    } else if (isSelected && !isCorrectOption) {
                      bgClass = 'bg-red-50 border-red-300';
                      textClass = 'text-red-900';
                      icon = <XCircle size={18} className="text-red-500" />;
                    }

                    return (
                      <div key={opt} className={`relative flex items-center p-4 rounded-xl border ${bgClass} transition-all`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold mr-4 ${
                          isCorrectOption ? 'bg-emerald-200 text-emerald-800' : 
                          isSelected ? 'bg-red-200 text-red-800' : 
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {opt}
                        </div>
                        <div className={`flex-1 ${textClass}`}>
                          {text}
                        </div>
                        {icon && (
                          <div className="flex-shrink-0 ml-4">
                            {icon}
                          </div>
                        )}
                        
                        {/* Selected Indicator Label */}
                        {isSelected && (
                          <div className="absolute -top-2.5 -right-2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                            Jawaban Anda
                          </div>
                        )}
                        {isCorrectOption && !isSelected && (
                          <div className="absolute -top-2.5 -right-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                            Kunci Jawaban
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {!hasAnswered && (
                  <div className="mt-4 p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium flex items-center gap-2">
                    <Clock size={16} />
                    Anda tidak menjawab soal ini.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
