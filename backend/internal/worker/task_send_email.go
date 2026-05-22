package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/smtp"
	"os"

	"github.com/hibiken/asynq"
)

const TaskSendEmail = "task:send_email"

type PayloadSendEmail struct {
	ToAddress string `json:"to_address"`
	Subject   string `json:"subject"`
	Body      string `json:"body"`
}

func (distributor *RedisTaskDistributor) DistributeTaskSendEmail(
	ctx context.Context,
	payload *PayloadSendEmail,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendEmail, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Printf("Enqueued task: type=%s queue=%s id=%s", task.Type(), info.Queue, info.ID)
	return nil
}

func (processor *RedisTaskProcessor) ProcessTaskSendEmail(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendEmail
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Processing email to: %s, subject: %s", payload.ToAddress, payload.Subject)

	// SMTP configuration from env
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpSender := os.Getenv("SMTP_SENDER")

	if smtpHost == "" || smtpPort == "" {
		log.Printf("Peringatan: Konfigurasi SMTP tidak lengkap. Email tidak dikirim.")
		return nil // Return nil agar task tidak ter-retry berulang kali jika config memang belum di set
	}

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s", smtpSender, payload.ToAddress, payload.Subject, payload.Body))

	err := smtp.SendMail(fmt.Sprintf("%s:%s", smtpHost, smtpPort), auth, smtpUser, []string{payload.ToAddress}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("Email successfully sent to %s", payload.ToAddress)
	return nil
}
