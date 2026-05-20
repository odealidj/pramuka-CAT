/**
 * Question Service — API untuk manajemen bank soal
 * Endpoint: /admin/questions
 */

import httpClient from '@/lib/http-client';
import type {
  ApiSuccessResponse,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  PaginatedResponse,
} from '@/types/auth';

export const listQuestionsApi = async (
  page = 1,
  limit = 10,
  search = '',
  categoryId?: number
): Promise<PaginatedResponse<Question>> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(categoryId ? { category_id: String(categoryId) } : {}),
  });
  const res = await httpClient.get<ApiSuccessResponse<Question[]>>(
    `/admin/questions?${params.toString()}`
  );
  return { data: res.data.data, meta: res.data.meta! };
};

/** GET /admin/questions/:id */
export const getQuestionApi = async (id: string): Promise<Question> => {
  const res = await httpClient.get<ApiSuccessResponse<Question>>(
    `/admin/questions/${id}`
  );
  return res.data.data;
};

/** POST /admin/questions */
export const createQuestionApi = async (
  payload: CreateQuestionRequest
): Promise<Question> => {
  const res = await httpClient.post<ApiSuccessResponse<Question>>(
    '/admin/questions',
    payload
  );
  return res.data.data;
};

/** PUT /admin/questions/:id */
export const updateQuestionApi = async (
  id: string,
  payload: UpdateQuestionRequest
): Promise<Question> => {
  const res = await httpClient.put<ApiSuccessResponse<Question>>(
    `/admin/questions/${id}`,
    payload
  );
  return res.data.data;
};

/** DELETE /admin/questions/:id */
export const deleteQuestionApi = async (id: string): Promise<void> => {
  await httpClient.delete(`/admin/questions/${id}`);
};
