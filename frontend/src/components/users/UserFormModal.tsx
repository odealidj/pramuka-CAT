'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/auth';

// ============================================================
// Zod Schemas
// ============================================================
const createSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  role: z.enum(['admin', 'peserta']),
  photo_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

const editSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  role: z.enum(['admin', 'peserta']),
  photo_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

// ============================================================
// Props
// ============================================================
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  user?: User | null;
  onSubmit: (
    data: CreateUserRequest | UpdateUserRequest
  ) => Promise<void>;
  apiError?: string | null;
}

// ============================================================
// Shared Field Component
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
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-all ${
    hasError
      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
      : 'border-gray-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'
  }`;

// ============================================================
// Main Component
// ============================================================
export default function UserFormModal({
  isOpen,
  onClose,
  mode,
  user,
  onSubmit,
  apiError,
}: UserFormModalProps) {
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues | EditFormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: {
      username: '',
      password: '',
      full_name: '',
      role: 'peserta',
      photo_url: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEdit && user) {
      reset({
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        photo_url: user.photo_url ?? '',
      });
    } else if (!isEdit) {
      reset({
        username: '',
        password: '',
        full_name: '',
        role: 'peserta',
        photo_url: '',
      });
    }
  }, [isEdit, user, reset, isOpen]);

  const handleFormSubmit = async (values: CreateFormValues | EditFormValues) => {
    const payload = {
      ...values,
      photo_url: values.photo_url || undefined,
    };
    await onSubmit(payload as CreateUserRequest | UpdateUserRequest);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
    >
      {apiError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{apiError}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Full Name */}
        <Field label="Nama Lengkap" error={errors.full_name?.message} required>
          <input
            type="text"
            placeholder="Contoh: Budi Santoso"
            disabled={isSubmitting}
            {...register('full_name')}
            className={inputClass(!!errors.full_name)}
          />
        </Field>

        {/* Username */}
        <Field label="Username" error={errors.username?.message} required>
          <input
            type="text"
            placeholder="Contoh: budi_santoso"
            disabled={isSubmitting}
            {...register('username')}
            className={inputClass(!!errors.username)}
          />
        </Field>

        {/* Password — only on create */}
        {!isEdit && (
          <Field
            label="Password"
            error={(errors as { password?: { message?: string } }).password?.message}
            required
          >
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              disabled={isSubmitting}
              {...register('password' as never)}
              className={inputClass(!!(errors as { password?: unknown }).password)}
            />
          </Field>
        )}

        {/* Role */}
        <Field label="Role / Peran" error={errors.role?.message} required>
          <select
            disabled={isSubmitting}
            {...register('role')}
            className={`${inputClass(!!errors.role)} appearance-none cursor-pointer`}
          >
            <option value="peserta">Peserta</option>
            <option value="admin">Admin / Panitia</option>
          </select>
        </Field>

        {/* Photo URL (optional) */}
        <Field label="URL Foto Profil" error={errors.photo_url?.message}>
          <input
            type="url"
            placeholder="https://example.com/foto.jpg (opsional)"
            disabled={isSubmitting}
            {...register('photo_url')}
            className={inputClass(!!errors.photo_url)}
          />
        </Field>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-2">
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
            {isSubmitting
              ? 'Menyimpan...'
              : isEdit
              ? 'Simpan Perubahan'
              : 'Tambah Pengguna'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
