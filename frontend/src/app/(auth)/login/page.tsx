import { FlameKindling } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B1F0A] via-[#5C3010] to-[#7C4318] flex items-center justify-center p-4">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5C3010] to-[#9C5A22] px-8 py-8 text-center">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-4 shadow-lg">
              <FlameKindling size={32} className="text-amber-300" />
            </div>
            <h1 className="text-white text-2xl font-bold">Pramuka CAT</h1>
            <p className="text-amber-200/80 text-sm mt-1">
              Sistem Computer Assisted Test
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-gray-800 text-xl font-bold mb-1">
              Selamat Datang!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Silakan masuk untuk melanjutkan
            </p>

            <form className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Masukkan username Anda"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#7C4318] to-[#9C5A22] text-white font-semibold py-3 rounded-xl hover:from-[#5C3010] hover:to-[#7C4318] transition-all shadow-lg shadow-amber-900/25 mt-2"
              >
                Masuk
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} Gerakan Pramuka — Sistem Ujian Digital
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
