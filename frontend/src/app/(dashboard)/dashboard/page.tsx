'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getInMemoryToken } from "@/lib/http-client";
import {
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
  User as UserIcon,
} from "lucide-react";
import { getPhotoUrl } from "@/lib/constants";

import StatCard from "@/components/ui/StatCard";

// --- Recent Activity Item ---
function ActivityItem({
  name,
  photo_url,
  action,
  time,
  status,
}: {
  name: string;
  photo_url?: string;
  action: string;
  time: string;
  status: "approved" | "pending" | "completed" | "expired" | "revoked";
}) {
  const statusConfig = {
    approved: {
      label: "Disetujui",
      cls: "bg-[#FAF7F2] text-[#7A4520] border-[#E8DCC8]",
    },
    pending: {
      label: "Menunggu",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    completed: {
      label: "Selesai",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    expired: {
      label: "Waktu Habis",
      cls: "bg-gray-50 text-gray-600 border-gray-200",
    },
    revoked: {
      label: "Dibatalkan",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const s = statusConfig[status];

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm border border-white/50">
        {photo_url ? (
          <img src={getPhotoUrl(photo_url) || ''} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E8B478] to-[#9C5A22] flex items-center justify-center shadow-inner">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 text-sm font-semibold truncate">{name}</p>
        <p className="text-gray-400 text-xs truncate">{action}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.cls}`}
        >
          {s.label}
        </span>
        <span className="text-gray-400 text-xs">{time}</span>
      </div>
    </div>
  );
}

// --- Admin Dashboard ---
function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getInMemoryToken();
    if (!token) {
      setError("Tidak ada token otorisasi");
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    // Menghubungkan ke endpoint SSE dengan token di query string
    const eventSource = new EventSource(`${apiUrl}/admin/dashboard/stream?token=${token}`);

    const fetchDashboardData = async () => {
      try {
        const token = getInMemoryToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        const res = await fetch(`${apiUrl}/admin/dashboard/stats`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const res = JSON.parse(event.data);
        if (res) {
          if (res.event) {
            // Merupakan notifikasi update dari server (misal: event = 'approval_changed')
            // Lakukan refetch data terbaru
            fetchDashboardData();
          } else if (res.stats) {
            // Merupakan data penuh inisial yang dikirim server saat pertama kali connect
            setData(res);
            setLoading(false);
            setError(null);
          }
        }
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      // EventSource akan otomatis mencoba reconnect
    };

    // Bersihkan listener saat komponen dilepas
    return () => {
      eventSource.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100">
        <p className="font-semibold text-sm">Gagal Memuat Data</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Peserta",
      value: data?.stats.total_participants.toLocaleString() || "0",
      change: "LIVE",
      changeType: "up" as const,
      changeSuffix: "dari bulan lalu",
      icon: <Users size={20} className="text-[#7A4520]" />,
    },
    {
      title: "Bank Soal",
      value: data?.stats.total_questions.toLocaleString() || "0",
      change: "LIVE",
      changeType: "up" as const,
      changeSuffix: "dari bulan lalu",
      icon: <BookOpen size={20} className="text-[#9C5A22]" />,
    },
    {
      title: "Event Aktif",
      value: data?.stats.active_events.toLocaleString() || "0",
      change: "LIVE",
      changeType: "up" as const,
      changeSuffix: "dari bulan lalu",
      icon: <CalendarDays size={20} className="text-[#5C3010]" />,
    },
    {
      title: "Ujian Selesai",
      value: data?.stats.completed_exams.toLocaleString() || "0",
      change: "LIVE",
      changeType: "up" as const,
      changeSuffix: "dari bulan lalu",
      icon: <ClipboardCheck size={20} className="text-[#D4924A]" />,
    },
  ];

  const activities = (data?.activities || []).map((a: any) => {
    // Determine relative time
    const date = new Date(a.time);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let timeStr = "";
    if (diffInSeconds < 60) timeStr = "Baru saja";
    else if (diffInSeconds < 3600) timeStr = `${Math.floor(diffInSeconds / 60)} menit lalu`;
    else if (diffInSeconds < 86400) timeStr = `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    else timeStr = `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    
    let statusConfig: "pending" | "completed" | "approved" | "expired" | "revoked" = "pending";
    if (a.status === "completed" || a.action.includes("Menyelesaikan")) {
      statusConfig = "completed";
    } else if (a.status === "approved") {
      statusConfig = "approved";
    } else if (a.status === "revoked") {
      statusConfig = "revoked";
    } else if (a.status === "pending" && a.event_end_time) {
      if (now.getTime() > new Date(a.event_end_time).getTime()) {
        statusConfig = "expired";
      }
    }

    return {
      name: a.name,
      photo_url: a.photo_url,
      action: a.action,
      time: timeStr,
      status: statusConfig,
    };
  });

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
            Anda dapat memantau aktivitas secara real-time dan mengelola persetujuan ujian peserta.
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
          <span className="text-gray-400 text-xs">
            Update:{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
            })}
          </span>
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
            <Link href="/dashboard/activities" className="text-amber-700 text-xs font-medium hover:text-amber-900 flex items-center gap-1">
              Lihat semua <ArrowUpRight size={12} />
            </Link>
          </div>
          <div>
            {activities.length > 0 ? (
              activities.map((a: any, i: number) => (
                <ActivityItem key={i} {...a} />
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">Belum ada aktivitas terkini.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 font-semibold text-sm mb-4">
            ⚡ Aksi Cepat
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "Tambah Soal Baru",
                actionId: "question",
                color: "bg-white border border-[#E8DCC8] shadow-sm hover:shadow-md hover:border-[#D4924A] text-[#5C3010]",
                icon: "📝",
              },
              {
                label: "Buat Event Ujian",
                actionId: "event",
                color: "bg-white border border-[#E8DCC8] shadow-sm hover:shadow-md hover:border-[#D4924A] text-[#5C3010]",
                icon: "📅",
              },
              {
                label: "Tambah Peserta",
                actionId: "user",
                color: "bg-white border border-[#E8DCC8] shadow-sm hover:shadow-md hover:border-[#D4924A] text-[#5C3010]",
                icon: "👤",
              },
              {
                label: "Approval Peserta",
                href: "/dashboard/events",
                color: "bg-white border border-[#E8DCC8] shadow-sm hover:shadow-md hover:border-[#D4924A] text-[#5C3010]",
                icon: "✅",
              },
            ].map((action) => (
              action.href ? (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${action.color}`}
                >
                  <span className="text-base">{action.icon}</span>
                  {action.label}
                  <ArrowUpRight size={14} className="ml-auto opacity-50" />
                </Link>
              ) : (
                <button
                  key={action.actionId}
                  onClick={() => window.dispatchEvent(new CustomEvent('triggerQuickAction', { detail: action.actionId }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${action.color}`}
                >
                  <span className="text-base">{action.icon}</span>
                  {action.label}
                  <ArrowUpRight size={14} className="ml-auto opacity-50" />
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* We removed QuickActionModals here because it is now handled globally in layout.tsx */}
    </div>
  );
}

// --- Peserta Dashboard ---
function PesertaDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-[#4A2B18] via-[#7C4318] to-[#9C5A22] rounded-2xl p-6 overflow-hidden shadow-lg shadow-amber-900/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-16 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative z-10">
          <p className="text-amber-200 text-sm font-medium mb-1">
            Selamat datang 👋
          </p>
          <h2 className="text-white text-2xl font-bold mb-1">{user?.full_name || user?.username}</h2>
          <p className="text-amber-100/70 text-sm max-w-md">
            Pilih menu <b>Jadwal Ujian</b> untuk melihat daftar tryout yang tersedia dan status persetujuan ujian Anda.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E8DCC8] text-center">
        <div className="w-16 h-16 bg-[#FAF7F2] border border-[#E8DCC8] text-[#7C4318] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CalendarDays size={28} />
        </div>
        <h3 className="text-gray-900 font-bold text-lg mb-2">Siap untuk Ujian?</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
          Semua event ujian yang dapat Anda ikuti, baik yang akan datang maupun yang sedang berlangsung, dapat dilihat di halaman Jadwal Ujian.
        </p>
        <Link 
          href="/dashboard/events"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C4318] to-[#9C5A22] hover:from-[#5C3010] hover:to-[#B45309] text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-md hover:scale-105"
        >
          Lihat Jadwal Ujian <ArrowUpRight size={18} />
        </Link>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (user?.role === 'peserta') {
    return <PesertaDashboard />;
  }

  return <AdminDashboard />;
}
