'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { uploadPhotoApi, updateProfileApi } from '@/services/user.service';
import { Camera, User as UserIcon, Upload, CheckCircle, AlertCircle, ArrowLeft, Save, X } from 'lucide-react';
import { API_BASE_URL, getPhotoUrl } from '@/lib/constants';
import Spinner from '@/components/ui/Spinner';
import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/auth';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', username: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || ''
      });
    }
  }, [user]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


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

  
  const handleProfileSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await updateProfileApi(formData);
      updateUser({ full_name: res.full_name, username: res.username, email: res.email });
      setSuccessMsg('Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (err) {
      if (isAxiosError(err)) {
        setErrorMsg((err.response?.data as any)?.message || 'Gagal memperbarui profil.');
      } else {
        setErrorMsg('Terjadi kesalahan internal.');
      }
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-gray-900 text-2xl font-bold flex items-center gap-2">
            <UserIcon size={26} className="text-amber-700" />
            Profil Saya
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola informasi profil dan foto akun Anda
          </p>
        </div>
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-gray-800 font-bold">Informasi Pribadi</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-amber-600 text-sm font-semibold hover:text-amber-700">
                  Edit Profil
                </button>
              ) : (
                <button onClick={() => { setIsEditing(false); setFormData({ full_name: user.full_name, username: user.username, email: user.email || '' }); }} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
                  <X size={14} /> Batal
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</label>
              {isEditing ? (
                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-sm font-medium">{user.full_name}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
              {isEditing ? (
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-sm font-medium">{user.username}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              {isEditing ? (
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-sm font-medium">{user.email || <span className="text-gray-400 italic">Belum diatur</span>}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Peran Akses (Role)</label>
              <div className="inline-flex px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                {user.role}
              </div>
            </div>
            
            {isEditing && (
              <button 
                onClick={handleProfileSave}
                disabled={isSaving || !formData.full_name || !formData.username || !formData.email}
                className="mt-4 w-full flex justify-center items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {isSaving ? <Spinner size={16} className="text-white" /> : <Save size={16} />}
                Simpan Perubahan
              </button>
            )}
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
