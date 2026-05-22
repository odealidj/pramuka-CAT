package main

import (
	"context"
	"log"
	"github.com/jackc/pgx/v5"
)

func main() {
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, "postgres://admin:secret@localhost:5432/pramuka_cat?sslmode=disable")
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(ctx)

	_, err = conn.Exec(ctx, "UPDATE users SET email = 'superadmin@pramukacat.com' WHERE role = 'super_admin'")
	if err != nil {
		log.Fatalf("Update failed: %v\n", err)
	}
	log.Println("Superadmin email updated successfully!")
}
