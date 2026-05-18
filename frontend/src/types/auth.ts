/**
 * TypeScript interfaces yang mencerminkan domain structs dari Backend Go
 * Referensi: backend/internal/core/domain/auth.go & user.go
 */

// === Request Types ===

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// === Response Types ===

/** Data user tanpa password hash (mirror dari UserResponse di Go) */
export interface UserInfo {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'peserta';
}

/** Response sukses dari POST /auth/login */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserInfo;
}

/** Response sukses dari POST /auth/refresh */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

// === Standard API Response Wrapper ===
// Mencerminkan format response standar dari pkg/response di Backend

export interface ApiSuccessResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  trace_id?: string;
}

export interface ApiErrorResponse {
  success: boolean;
  code: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  trace_id?: string;
}
