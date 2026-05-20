/**
 * Event (Jadwal Ujian) Service
 * Endpoints: /admin/events
 */

import httpClient from '@/lib/http-client';
import type {
  ApiSuccessResponse,
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventParticipant,
  AddEventQuestionRequest,
  AddRandomEventQuestionsRequest,
  Question,
  PaginatedResponse,
} from '@/types/auth';

// ─── Event CRUD ──────────────────────────────────────────────────────────────

export const listEventsApi = async (
  page = 1,
  limit = 10,
  search = ''
): Promise<PaginatedResponse<Event>> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });
  const res = await httpClient.get<ApiSuccessResponse<Event[]>>(
    `/admin/events?${params.toString()}`
  );
  return { data: res.data.data, meta: res.data.meta! };
};

export const getEventApi = async (id: string): Promise<Event> => {
  const res = await httpClient.get<ApiSuccessResponse<Event>>(
    `/admin/events/${id}`
  );
  return res.data.data;
};

export const createEventApi = async (payload: CreateEventRequest): Promise<Event> => {
  const res = await httpClient.post<ApiSuccessResponse<Event>>(
    '/admin/events',
    payload
  );
  return res.data.data;
};

export const updateEventApi = async (
  id: string,
  payload: UpdateEventRequest
): Promise<Event> => {
  const res = await httpClient.put<ApiSuccessResponse<Event>>(
    `/admin/events/${id}`,
    payload
  );
  return res.data.data;
};

export const deleteEventApi = async (id: string): Promise<void> => {
  await httpClient.delete(`/admin/events/${id}`);
};

// ─── Event Questions ──────────────────────────────────────────────────────────

export const listEventQuestionsApi = async (
  eventId: string,
  page = 1,
  limit = 50
): Promise<PaginatedResponse<Question>> => {
  const res = await httpClient.get<ApiSuccessResponse<Question[]>>(
    `/admin/events/${eventId}/questions?page=${page}&limit=${limit}`
  );
  return { data: res.data.data, meta: res.data.meta! };
};

export const addEventQuestionApi = async (
  eventId: string,
  payload: AddEventQuestionRequest
): Promise<void> => {
  await httpClient.post(`/admin/events/${eventId}/questions`, payload);
};

export const addRandomEventQuestionsApi = async (
  eventId: string,
  payload: AddRandomEventQuestionsRequest
): Promise<void> => {
  await httpClient.post(`/admin/events/${eventId}/random-questions`, payload);
};

export const removeEventQuestionApi = async (
  eventId: string,
  questionId: string
): Promise<void> => {
  await httpClient.delete(`/admin/events/${eventId}/questions/${questionId}`);
};

// ─── Event Participants ───────────────────────────────────────────────────────

export const listEventParticipantsApi = async (
  eventId: string,
  page = 1,
  limit = 50
): Promise<PaginatedResponse<EventParticipant>> => {
  const res = await httpClient.get<ApiSuccessResponse<EventParticipant[]>>(
    `/admin/events/${eventId}/participants?page=${page}&limit=${limit}`
  );
  return { data: res.data.data, meta: res.data.meta! };
};

export const approveParticipantApi = async (
  eventId: string,
  approvalId: string
): Promise<void> => {
  await httpClient.put(`/admin/events/${eventId}/participants/${approvalId}/approve`, {});
};

export const revokeParticipantApi = async (
  eventId: string,
  approvalId: string
): Promise<void> => {
  await httpClient.put(`/admin/events/${eventId}/participants/${approvalId}/revoke`, {});
};

// ─── Export ───────────────────────────────────────────────────────────────────

/** Returns the download URL — caller opens it in a new tab */
export const getExportUrl = (eventId: string, format: 'excel' | 'pdf'): string => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return `${base}/admin/events/${eventId}/export?format=${format}`;
};
