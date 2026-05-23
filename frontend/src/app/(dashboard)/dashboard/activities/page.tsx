'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi, DashboardActivity } from "@/lib/api/dashboard";
import { ChevronLeft, ChevronRight, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const limit = 10;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await dashboardApi.getActivities(page, limit);
        setActivities(res.data.data);
        setTotalPages(res.data.total_pages);
        setTotalItems(res.data.total_items);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching activities:", err);
        setError("Gagal memuat log aktivitas. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchActivities();
    } else {
      setLoading(false);
    }
  }, [page, isAdmin]);

  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Activity size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 mb-6">
          Anda tidak memiliki izin untuk melihat halaman ini.
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const renderActivityItem = (a: DashboardActivity, index: number) => {
    // Determine relative time
    const date = new Date(a.time);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let timeStr = "";
    if (diffInSeconds < 60) timeStr = "Baru saja";
    else if (diffInSeconds < 3600) timeStr = `${Math.floor(diffInSeconds / 60)} menit lalu`;
    else if (diffInSeconds < 86400) timeStr = `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    else timeStr = `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    
    let statusConfig: "pending" | "completed" | "approved" | "expired" = "pending";
    if (a.status === "completed" || a.action.includes("Menyelesaikan")) {
      statusConfig = "completed";
    } else if (a.status === "approved") {
      statusConfig = "approved";
    } else if (a.status === "pending" && a.event_end_time) {
      if (now.getTime() > new Date(a.event_end_time).getTime()) {
        statusConfig = "expired";
      }
    }

    const sConfig = {
      approved: {
        label: "Disetujui",
        cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
      },
      pending: {
        label: "Menunggu",
        cls: "bg-amber-50 text-amber-600 border-amber-100",
      },
      completed: {
        label: "Selesai",
        cls: "bg-blue-50 text-blue-600 border-blue-100",
      },
      expired: {
        label: "Waktu Habis",
        cls: "bg-gray-50 text-gray-500 border-gray-200",
      },
    };
    const s = sConfig[statusConfig];

    return (
      <div key={index} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-4 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
          {a.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 text-sm font-semibold truncate">{a.name}</p>
          <p className="text-gray-500 text-sm truncate mt-0.5">{a.action}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${s.cls}`}
          >
            {s.label}
          </span>
          <span className="text-gray-400 text-xs">{timeStr}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="p-2 bg-white text-gray-500 hover:text-amber-600 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Log Aktivitas</h1>
          <p className="text-gray-500 text-sm">Jejak rekam aktivitas peserta di dalam sistem.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 flex-1">
            <Spinner size={32} className="text-amber-500 mb-4" />
            <p className="text-gray-500 text-sm">Memuat log aktivitas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 flex-1">
            <Activity size={48} className="mb-4 opacity-50" />
            <p className="font-medium">{error}</p>
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="flex-1">
              {activities.map((a, i) => renderActivityItem(a, i))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-sm text-gray-500">
                Menampilkan <span className="font-medium text-gray-900">{activities.length}</span> dari <span className="font-medium text-gray-900">{totalItems}</span> aktivitas
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <div className="flex items-center justify-center min-w-[2.5rem] text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-100">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 flex-1">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <Activity size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Belum ada aktivitas di dalam sistem.</p>
          </div>
        )}
      </div>
    </div>
  );
}
