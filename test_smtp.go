package main

import (
	"fmt"
	"net/smtp"
	"os"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpSender := os.Getenv("SMTP_SENDER")

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s", smtpSender, "odealidj1.go@gmail.com", "Test Email", "Hello World"))

	err := smtp.SendMail(fmt.Sprintf("%s:%s", smtpHost, smtpPort), auth, smtpUser, []string{"odealidj1.go@gmail.com"}, msg)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Success")
	}
}
