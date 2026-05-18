import {
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

// --- Stat Card ---
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                changeType === 'up'
                  ? 'bg-emerald-50 text-emerald-600'
                  : changeType === 'down'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {change}
            </span>
            <span className="text-gray-400 text-xs">dari bulan lalu</span>
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${color} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// --- Recent Activity Item ---
function ActivityItem({
  name,
  action,
  time,
  status,
}: {
  name: string;
  action: string;
  time: string;
  status: 'approved' | 'pending' | 'completed';
}) {
  const statusConfig = {
    approved: { label: 'Disetujui', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    pending: { label: 'Menunggu', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    completed: { label: 'Selesai', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  };
  const s = statusConfig[status];

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 text-sm font-semibold truncate">{name}</p>
        <p className="text-gray-400 text-xs truncate">{action}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.cls}`}>
          {s.label}
        </span>
        <span className="text-gray-400 text-xs">{time}</span>
      </div>
    </div>
  );
}

// --- Dashboard Page ---
export default function DashboardPage() {
  const stats: StatCardProps[] = [
    {
      title: 'Total Peserta',
      value: '248',
      change: '+12%',
      changeType: 'up',
      icon: <Users size={20} className="text-violet-600" />,
      color: 'bg-violet-50',
    },
    {
      title: 'Bank Soal',
      value: '1,432',
      change: '+34 soal',
      changeType: 'up',
      icon: <BookOpen size={20} className="text-amber-600" />,
      color: 'bg-amber-50',
    },
    {
      title: 'Event Aktif',
      value: '5',
      change: '+2 baru',
      changeType: 'up',
      icon: <CalendarDays size={20} className="text-blue-600" />,
      color: 'bg-blue-50',
    },
    {
      title: 'Ujian Selesai',
      value: '186',
      change: '+18%',
      changeType: 'up',
      icon: <ClipboardCheck size={20} className="text-emerald-600" />,
      color: 'bg-emerald-50',
    },
  ];

  const activities = [
    { name: 'Raka Sanjaya', action: 'Mendaftar event: Ujian Penegak 2025', time: '5 menit lalu', status: 'pending' as const },
    { name: 'Dewi Putri', action: 'Menyelesaikan ujian dengan skor 92', time: '23 menit lalu', status: 'completed' as const },
    { name: 'Ahmad Yusuf', action: 'Persetujuan ujian disetujui admin', time: '1 jam lalu', status: 'approved' as const },
    { name: 'Siti Rahma', action: 'Mendaftar event: Uji Kompetensi Penggalang', time: '2 jam lalu', status: 'pending' as const },
    { name: 'Budi Santoso', action: 'Menyelesaikan ujian dengan skor 78', time: '3 jam lalu', status: 'completed' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-[#5C3010] via-[#7C4318] to-[#9C5A22] rounded-2xl p-6 overflow-hidden shadow-lg">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-16 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative z-10">
          <p className="text-amber-200 text-sm font-medium mb-1">
            Selamat datang kembali 👋
          </p>
          <h2 className="text-white text-2xl font-bold mb-1">Admin Pramuka</h2>
          <p className="text-amber-100/70 text-sm max-w-md">
            Ada <span className="text-amber-300 font-semibold">7 peserta</span> yang menunggu
            persetujuan untuk mengikuti ujian hari ini.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 font-semibold text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-600" />
            Statistik Sistem
          </h3>
          <span className="text-gray-400 text-xs">Update: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800 font-semibold text-sm flex items-center gap-2">
              <Activity size={16} className="text-amber-600" />
              Aktivitas Terkini
            </h3>
            <button className="text-amber-700 text-xs font-medium hover:text-amber-900 flex items-center gap-1">
              Lihat semua <ArrowUpRight size={12} />
            </button>
          </div>
          <div>
            {activities.map((a, i) => (
              <ActivityItem key={i} {...a} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 font-semibold text-sm mb-4">
            ⚡ Aksi Cepat
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Tambah Soal Baru', href: '/dashboard/questions/new', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', icon: '📝' },
              { label: 'Buat Event Ujian', href: '/dashboard/events/new', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon: '📅' },
              { label: 'Tambah Peserta', href: '/dashboard/users/new', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100', icon: '👤' },
              { label: 'Approval Peserta', href: '/dashboard/events', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', icon: '✅' },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${action.color}`}
              >
                <span className="text-base">{action.icon}</span>
                {action.label}
                <ArrowUpRight size={14} className="ml-auto opacity-50" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
