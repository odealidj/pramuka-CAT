package domain

import "time"

type DashboardStats struct {
	TotalParticipants int64 `json:"total_participants"`
	TotalQuestions    int64 `json:"total_questions"`
	ActiveEvents      int64 `json:"active_events"`
	CompletedExams    int64 `json:"completed_exams"`
}

type DashboardActivity struct {
	UserName  string    `json:"name"`
	Action    string    `json:"action"`
	Time      time.Time `json:"time"`
	Status    string    `json:"status"` // "pending", "approved", "completed"
}

type DashboardData struct {
	Stats      DashboardStats      `json:"stats"`
	Activities []DashboardActivity `json:"activities"`
}
