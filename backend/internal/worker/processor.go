package worker

import (
	"context"
	"github.com/hibiken/asynq"
	"log"

	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
)

const (
	QueueCritical = "critical"
	QueueDefault  = "default"
)

// TaskProcessor mendefinisikan interface untuk memproses job
type TaskProcessor interface {
	Start() error
	ProcessTaskSendEmail(ctx context.Context, task *asynq.Task) error
	ProcessTaskCreateNotification(ctx context.Context, task *asynq.Task) error
}

type RedisTaskProcessor struct {
	server *asynq.Server
	repo   *sqlcgen.Queries // Akses ke database untuk nyimpan notif
}

func NewRedisTaskProcessor(redisOpt asynq.RedisClientOpt, repo *sqlcgen.Queries) TaskProcessor {
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Queues: map[string]int{
				QueueCritical: 10,
				QueueDefault:  5,
			},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				log.Printf("ERROR: Process task %s failed: %v", task.Type(), err)
			}),
		},
	)

	return &RedisTaskProcessor{
		server: server,
		repo:   repo,
	}
}

func (processor *RedisTaskProcessor) Start() error {
	mux := asynq.NewServeMux()

	mux.HandleFunc(TaskSendEmail, processor.ProcessTaskSendEmail)
	mux.HandleFunc(TaskCreateNotification, processor.ProcessTaskCreateNotification)

	return processor.server.Start(mux)
}
