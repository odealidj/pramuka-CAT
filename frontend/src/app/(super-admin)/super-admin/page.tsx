import { ShieldCheck } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-purple-50 flex flex-col items-center justify-center text-purple-600">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Selamat Datang, Super Admin!
          </h1>
          <p className="text-gray-500">
            Anda berada di area kendali utama Pramuka CAT.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Admin</h3>
          <p className="text-3xl font-bold text-gray-800">Kelola Admin</p>
          <p className="text-sm text-gray-500 mt-2">Hanya Super Admin yang dapat menambah atau menghapus panitia (Admin).</p>
        </div>
      </div>
    </div>
  );
}
