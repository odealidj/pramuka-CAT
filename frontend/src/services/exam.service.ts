/**
 * Hasil Ujian (Exam Results) Service
 *
 * Pendekatan: Data hasil ujian diambil dari endpoint peserta per event
 * - GET /admin/events/:id/participants  → daftar peserta + skor (EventParticipant)
 * - GET /admin/exams/approvals/:approval_id/answers → review detail jawaban
 *
 * Service ini menyediakan fungsi untuk fitur laporan admin.
 */

import httpClient from '@/lib/http-client';
import type { ApiSuccessResponse, UserAnswerDetail, EventParticipant, PaginatedResponse } from '@/types/auth';

/**
 * GET /admin/exams/approvals/:approval_id/answers
 * Mengambil detail jawaban peserta untuk review admin
 */
export const reviewParticipantAnswersApi = async (
  approvalId: string
): Promise<UserAnswerDetail[]> => {
  const res = await httpClient.get<ApiSuccessResponse<UserAnswerDetail[]>>(
    `/admin/exams/approvals/${approvalId}/answers`
  );
  return res.data.data;
};

/**
 * GET /admin/events/:id/participants  (re-export helper)
 * Digunakan oleh halaman hasil ujian untuk mendapatkan daftar peserta + skor
 * per event tanpa perlu impor dari event.service
 */
export const getEventParticipantsApi = async (
  eventId: string,
  page = 1,
  limit = 100
): Promise<PaginatedResponse<EventParticipant>> => {
  const res = await httpClient.get<ApiSuccessResponse<EventParticipant[]>>(
    `/admin/events/${eventId}/participants?page=${page}&limit=${limit}`
  );
  return { data: res.data.data, meta: res.data.meta! };
};
