const fs = require('fs');
const file = '/home/aliube/Workspace/Prd/PramukaCAT/frontend/src/app/(dashboard)/dashboard/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
  "import { useState, useRef } from 'react';",
  "import { useState, useRef, useEffect } from 'react';\nimport { useRouter } from 'next/navigation';"
);
content = content.replace(
  "import { uploadPhotoApi } from '@/services/user.service';",
  "import { uploadPhotoApi, updateProfileApi } from '@/services/user.service';"
);
content = content.replace(
  "import { Camera, User as UserIcon, Upload, CheckCircle, AlertCircle } from 'lucide-react';",
  "import { Camera, User as UserIcon, Upload, CheckCircle, AlertCircle, ArrowLeft, Save, X } from 'lucide-react';"
);

// Add hooks and state
content = content.replace(
  "const { user, updateUser } = useAuth();",
  "const { user, updateUser } = useAuth();\n  const router = useRouter();\n  const [isEditing, setIsEditing] = useState(false);\n  const [formData, setFormData] = useState({ full_name: '', username: '', email: '' });\n  const [isSaving, setIsSaving] = useState(false);\n\n  useEffect(() => {\n    if (user) {\n      setFormData({\n        full_name: user.full_name || '',\n        username: user.username || '',\n        email: user.email || ''\n      });\n    }\n  }, [user]);"
);

// Add handler for profile update
const updateProfileHandler = `
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
`;
content = content.replace(
  "const handleUpload = async () => {",
  updateProfileHandler + "\n  const handleUpload = async () => {"
);

// Add back button
content = content.replace(
  "      {/* Page Header */}",
  `      {/* Page Header */}\n      <div className="flex items-center gap-3 mb-2">\n        <button onClick={() => router.back()} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all">\n          <ArrowLeft size={18} />\n        </button>\n        <div>\n          <h1 className="text-gray-900 text-2xl font-bold flex items-center gap-2">\n            <UserIcon size={26} className="text-amber-700" />\n            Profil Saya\n          </h1>\n          <p className="text-gray-500 text-sm mt-1">\n            Kelola informasi profil dan foto akun Anda\n          </p>\n        </div>\n      </div>`
);

// Replace header section which was modified just above to prevent duplicate
content = content.replace(
  `      <div>
        <h1 className="text-gray-900 text-2xl font-bold flex items-center gap-2">
          <UserIcon size={26} className="text-amber-700" />
          Profil Saya
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola informasi profil dan foto akun Anda
        </p>
      </div>`,
  ""
);

// Replace static fields with editable ones
const editableFields = `          <div className="space-y-4">
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
          </div>`;

content = content.replace(
  /<div className="space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*<hr className="border-gray-100" \/>/m,
  editableFields + "\n\n          <hr className=\"border-gray-100\" />"
);

fs.writeFileSync(file, content);
