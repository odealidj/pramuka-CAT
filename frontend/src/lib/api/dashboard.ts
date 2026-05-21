import axiosInstance from './axios';

export interface DashboardStats {
  total_participants: number;
  total_questions: number;
  active_events: number;
  completed_exams: number;
}

export interface DashboardActivity {
  name: string;
  action: string;
  time: string;
  status: 'pending' | 'approved' | 'completed';
}

export interface DashboardData {
  stats: DashboardStats;
  activities: DashboardActivity[];
}

export interface DashboardResponse {
  message: string;
  data: DashboardData;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardResponse> => {
    const response = await axiosInstance.get('/admin/dashboard/stats');
    return response.data;
  },
};
