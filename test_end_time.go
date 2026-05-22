package main

import (
	"context"
	"fmt"
	"log"
	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/services"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository"
)

func main() {
	db, err := pgxpool.New(context.Background(), "postgresql://root:root@localhost:5432/pramuka_cat?sslmode=disable")
	if err != nil { log.Fatal(err) }
	
	repo := repository.NewExamRepository(db)
	
	userID := uuid.MustParse("67b2840d-586f-49d9-9b34-69e1f45bc078")
	eventID := uuid.MustParse("9b909f79-74b4-4750-81f6-82706b1c4363")
	
	approval, err := repo.GetApprovalStatus(context.Background(), userID, eventID)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("EndTime from repo:", approval.EndTime)
	
	var dbEndTime string
	err = db.QueryRow(context.Background(), "SELECT end_time FROM events WHERE id = $1", eventID).Scan(&dbEndTime)
	fmt.Println("EndTime from raw string scan:", dbEndTime)
}
