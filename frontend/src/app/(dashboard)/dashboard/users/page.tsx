'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  RefreshCw,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { isAxiosError } from 'axios';

import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import UserFormModal from '@/components/users/UserFormModal';
import ChangePasswordModal from '@/components/users/ChangePasswordModal';
import { getPhotoUrl } from '@/lib/constants';

import {
  listUsersApi,
  createUserApi,
  updateUserApi,
  updateUserPasswordApi,
  deleteUserApi,
} from '@/services/user.service';
import type {
  User,
  PaginationMeta,
  CreateUserRequest,
  UpdateUserRequest,
  ApiErrorResponse,
} from '@/types/auth';

// ============================================================
// Helper — get initials from name
// ============================================================
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

// ============================================================
// Helper — format date
// ============================================================
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================================
// Page Component Content
// ============================================================
function UsersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // --- Data State ---
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // --- Modal State ---
  const [formModal, setFormModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    user: User | null;
  }>({ open: false, mode: 'create', user: null });

  const [passwordModal, setPasswordModal] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
    isLoading: boolean;
  }>({ open: false, user: null, isLoading: false });

  // --- Error State (for modals) ---
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [passwordApiError, setPasswordApiError] = useState<string | null>(null);

  // --- Toast ---
  const { toasts, toast, dismiss } = useToast();

  // ============================================================
  // Fetch Users
  // ============================================================
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listUsersApi(page, 10, search);
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      toast('error', 'Gagal memuat data pengguna.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle "new=true" from Quick Actions
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setFormModal({ open: true, mode: 'create', user: null });
      const params = new URLSearchParams(searchParams.toString());
      params.delete('new');
      router.replace(`/dashboard/users?${params.toString()}`);
    }
  }, [searchParams, router]);

  // Debounced search — trigger after 500ms typing stop
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ============================================================
  // Create User
  // ============================================================
  const handleCreate = async (data: CreateUserRequest | UpdateUserRequest) => {
    setFormApiError(null);
    try {
      await createUserApi(data as CreateUserRequest);
      toast('success', 'Pengguna baru berhasil ditambahkan.');
      setFormModal({ open: false, mode: 'create', user: null });
      fetchUsers();
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message ?? 'Gagal menambahkan pengguna.'
        : 'Terjadi kesalahan.';
      setFormApiError(msg);
      throw err; // keep form open
    }
  };

  // ============================================================
  // Update User
  // ============================================================
  const handleUpdate = async (data: CreateUserRequest | UpdateUserRequest) => {
    if (!formModal.user) return;
    setFormApiError(null);
    try {
      await updateUserApi(formModal.user.id, data as UpdateUserRequest);
      toast('success', 'Data pengguna berhasil diperbarui.');
      setFormModal({ open: false, mode: 'edit', user: null });
      fetchUsers();
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message ?? 'Gagal memperbarui pengguna.'
        : 'Terjadi kesalahan.';
      setFormApiError(msg);
      throw err;
    }
  };

  // ============================================================
  // Change Password
  // ============================================================
  const handleChangePassword = async (password: string) => {
    if (!passwordModal.user) return;
    setPasswordApiError(null);
    try {
      await updateUserPasswordApi(passwordModal.user.id, { password });
      toast('success', `Password ${passwordModal.user.full_name} berhasil diganti.`);
      setPasswordModal({ open: false, user: null });
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message ?? 'Gagal mengganti password.'
        : 'Terjadi kesalahan.';
      setPasswordApiError(msg);
      throw err;
    }
  };

  // ============================================================
  // Delete User
  // ============================================================
  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    setDeleteDialog((d) => ({ ...d, isLoading: true }));
    try {
      await deleteUserApi(deleteDialog.user.id);
      toast('success', `Pengguna ${deleteDialog.user.full_name} berhasil dihapus.`);
      setDeleteDialog({ open: false, user: null, isLoading: false });
      fetchUsers();
    } catch {
      toast('error', 'Gagal menghapus pengguna.');
      setDeleteDialog((d) => ({ ...d, isLoading: false }));
    }
  };

  // ============================================================
  // Stats
  // ============================================================
  const pesertaCount = meta ? users.length : 0;
  
  const filteredUsers = users;

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Users size={22} className="text-amber-700" />
            Manajemen Peserta
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Kelola akun peserta ujian
          </p>
        </div>
        <button
          onClick={() => {
            setFormApiError(null);
            setFormModal({ open: true, mode: 'create', user: null });
          }}
          id="btn-add-user"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white text-sm font-semibold rounded-xl shadow-sm shadow-amber-900/20 hover:from-[#5C3010] hover:to-[#7C4318] transition-all"
        >
          <UserPlus size={16} />
          Tambah Peserta
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-medium">Total Peserta</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            {meta?.total_records ?? '—'}
          </p>
        </div>
        <div
          className="text-left rounded-2xl p-4 border shadow-sm transition-all bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
        >
          <div className="flex items-center gap-2 mb-1">
            <UserX size={14} className="text-emerald-600" />
            <p className="text-gray-500 text-xs font-medium">Peserta Aktif</p>
          </div>
          <p className="text-gray-900 text-2xl font-bold">{pesertaCount}</p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-300 focus-within:bg-white transition-all relative">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pr-6"
              id="search-users"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Hapus filter"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>

          {/* Remove role filter from here */}

          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-all disabled:opacity-50"
            title="Refresh"
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">
                  No
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Pengguna
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Username
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Terdaftar
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Spinner size={24} className="text-amber-600" />
                      <span className="text-sm">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Users size={36} className="text-gray-200" />
                      <p className="text-sm font-medium text-gray-500">
                        {search
                          ? `Tidak ada peserta dengan kata kunci "${search}"`
                          : 'Belum ada peserta'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const rowNo = ((page - 1) * 10) + idx + 1;
                  const isDeleted = !!user.deleted_at;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50/60 transition-colors ${isDeleted ? 'opacity-50' : ''}`}
                    >
                      {/* No */}
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{rowNo}</td>

                      {/* Pengguna */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm overflow-hidden">
                            {user.photo_url ? (
                              <img src={getPhotoUrl(user.photo_url) || ''} alt="User Avatar" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(user.full_name)
                            )}
                          </div>
                          <div>
                            <p className="text-gray-900 font-semibold text-sm leading-tight">
                              {user.full_name}
                              {isDeleted && (
                                <span className="ml-2 text-xs text-red-400 font-normal">(Dihapus)</span>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs md:hidden">{user.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="font-mono text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-lg">
                          {user.username}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <Badge variant={user.role} />
                      </td>

                      {/* Terdaftar */}
                      <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => {
                              setFormApiError(null);
                              setFormModal({ open: true, mode: 'edit', user });
                            }}
                            disabled={isDeleted}
                            className="p-2 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Edit pengguna"
                            aria-label="Edit pengguna"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Ganti Password */}
                          <button
                            onClick={() => {
                              setPasswordApiError(null);
                              setPasswordModal({ open: true, user });
                            }}
                            disabled={isDeleted}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Ganti password"
                            aria-label="Ganti password"
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() =>
                              setDeleteDialog({ open: true, user, isLoading: false })
                            }
                            disabled={isDeleted}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Hapus pengguna"
                            aria-label="Hapus pengguna"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
            <p className="text-gray-400 text-xs">
              Menampilkan {((page - 1) * 10) + 1}–
              {Math.min(page * 10, meta.total_records)} dari{' '}
              {meta.total_records} pengguna
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
      <UserFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal((s) => ({ ...s, open: false }))}
        mode={formModal.mode}
        user={formModal.user}
        onSubmit={formModal.mode === 'create' ? handleCreate : handleUpdate}
        apiError={formApiError}
      />

      <ChangePasswordModal
        isOpen={passwordModal.open}
        onClose={() => setPasswordModal({ open: false, user: null })}
        userName={passwordModal.user?.full_name ?? ''}
        onSubmit={handleChangePassword}
        apiError={passwordApiError}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null, isLoading: false })}
        onConfirm={handleDelete}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna "${deleteDialog.user?.full_name}"? Tindakan ini tidak dapat dibatalkan.`}
        isLoading={deleteDialog.isLoading}
      />

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Spinner size={32} className="text-amber-600" /></div>}>
      <UsersContent />
    </Suspense>
  );
}
