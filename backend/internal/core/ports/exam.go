package ports

import (
	"context"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
)

type ExamRepository interface {
	ListUpcomingEvents(ctx context.Context) ([]domain.UpcomingEvent, error)
	ListUserApprovals(ctx context.Context, userID uuid.UUID) ([]domain.UserApproval, error)
	GetApprovalStatus(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) (domain.UserApproval, error)
	EnrollToEvent(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) error
	
	ListEventQuestionsForParticipant(ctx context.Context, eventID uuid.UUID) ([]domain.ParticipantQuestion, error)
	GetQuestionCorrectAnswer(ctx context.Context, questionID uuid.UUID) (string, error)
	SaveUserAnswer(ctx context.Context, approvalID uuid.UUID, questionID uuid.UUID, selectedAnswer string, isCorrect bool) error
	
	CalculateScore(ctx context.Context, approvalID uuid.UUID) (float64, error)
	FinishExam(ctx context.Context, approvalID uuid.UUID, score float64, isPassed bool) error
	
	GetEventById(ctx context.Context, id uuid.UUID) (domain.Event, error)
}

type ExamService interface {
	ListUpcomingEvents(ctx context.Context) ([]domain.UpcomingEvent, error)
	ListMyExams(ctx context.Context, userID uuid.UUID) ([]domain.UserApproval, error)
	Enroll(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) error
	
	StartExam(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) ([]domain.ParticipantQuestion, error)
	SubmitAnswer(ctx context.Context, userID uuid.UUID, eventID uuid.UUID, req domain.SubmitAnswerRequest) error
	FinishExam(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) (domain.FinishExamResponse, error)
}
