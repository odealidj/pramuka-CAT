/**
 * User Service — Fungsi-fungsi API untuk manajemen user (Admin)
 */

import httpClient from '@/lib/http-client';
import type {
  ApiSuccessResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdatePasswordRequest,
  PaginatedResponse,
} from '@/types/auth';

/** GET /admin/users?page=&limit=&search= */
export const listUsersApi = async (
  page = 1,
  limit = 10,
  search = ''
): Promise<PaginatedResponse<User>> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });
  const res = await httpClient.get<ApiSuccessResponse<User[]>>(
    `/admin/users?${params.toString()}`
  );
  return {
    data: res.data.data,
    meta: res.data.meta!,
  };
};

/** GET /admin/users/:id */
export const getUserApi = async (id: string): Promise<User> => {
  const res = await httpClient.get<ApiSuccessResponse<User>>(
    `/admin/users/${id}`
  );
  return res.data.data;
};

/** POST /admin/users */
export const createUserApi = async (
  payload: CreateUserRequest
): Promise<User> => {
  const res = await httpClient.post<ApiSuccessResponse<User>>(
    '/admin/users',
    payload
  );
  return res.data.data;
};

/** PUT /admin/users/:id */
export const updateUserApi = async (
  id: string,
  payload: UpdateUserRequest
): Promise<User> => {
  const res = await httpClient.put<ApiSuccessResponse<User>>(
    `/admin/users/${id}`,
    payload
  );
  return res.data.data;
};

/** PUT /admin/users/:id/password */
export const updateUserPasswordApi = async (
  id: string,
  payload: UpdatePasswordRequest
): Promise<void> => {
  await httpClient.put(`/admin/users/${id}/password`, payload);
};

/** DELETE /admin/users/:id */
export const deleteUserApi = async (id: string): Promise<void> => {
  await httpClient.delete(`/admin/users/${id}`);
};

/** POST /users/me/photo */
export const uploadPhotoApi = async (file: File): Promise<{ photo_url: string }> => {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await httpClient.post<ApiSuccessResponse<{ photo_url: string }>>(
    '/users/me/photo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data.data;
};
