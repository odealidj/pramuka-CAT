'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadPhotoApi } from '@/services/user.service';
import { Camera, User as UserIcon, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';
import Spinner from '@/components/ui/Spinner';
import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/auth';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fungsi untuk mendapatkan URL gambar yang benar dari backend
  const getPhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    
    // Asumsi API_BASE_URL berakhiran /api/v1
    const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    // photoPath dari backend formatnya `/uploads/...` atau `uploads/...`
    const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 5MB.');
      return;
    }

    // Validasi tipe (Hanya Gambar)
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Hanya file gambar (JPG/PNG) yang diperbolehkan.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await uploadPhotoApi(selectedFile);
      
      // Update global context & session storage
      updateUser({ photo_url: res.photo_url });
      
      setSuccessMsg('Foto profil berhasil diperbarui!');
      setSelectedFile(null); // Reset file supaya tombol upload hilang
    } catch (err) {
      if (isAxiosError(err)) {
        const errData = err.response?.data as ApiErrorResponse | undefined;
        setErrorMsg(errData?.message || 'Gagal mengunggah foto.');
      } else {
        setErrorMsg('Terjadi kesalahan internal.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null; // Belum dimuat

  const displayPhotoUrl = previewUrl || getPhotoUrl(user.photo_url);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-gray-900 text-2xl font-bold flex items-center gap-2">
          <UserIcon size={26} className="text-amber-700" />
          Profil Saya
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola informasi profil dan foto akun Anda
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Photo Uploader */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            {/* Photo Circle */}
            <div className="w-40 h-40 rounded-full border-4 border-gray-50 shadow-md overflow-hidden bg-gray-100 flex items-center justify-center relative">
              {displayPhotoUrl ? (
                <img 
                  src={displayPhotoUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={64} className="text-gray-300" />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <Camera size={28} className="text-white" />
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all border border-gray-200"
          >
            Pilih Foto Baru
          </button>
          <p className="text-[11px] text-gray-400 text-center px-4">
            Maks. ukuran file 5MB.<br/>Format: JPG, JPEG, PNG.
          </p>
        </div>

        {/* Right Side: Info & Actions */}
        <div className="flex-1 space-y-5">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-sm font-medium">
                {user.full_name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-sm font-medium">
                {user.username}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Peran Akses (Role)</label>
              <div className="inline-flex px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                {user.role}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-700 text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {/* Action Button: Upload */}
          {selectedFile && (
            <div className="pt-2">
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Spinner size={16} className="text-white/80" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Simpan Foto Profil</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
