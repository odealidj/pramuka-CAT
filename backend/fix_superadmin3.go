package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	connStr := "postgres://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/pramukacat?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}
	defer db.Close()

	res, err := db.Exec("UPDATE users SET email = 'superadmin@pramukacat.com' WHERE role = 'super_admin' AND email IS NULL")
	if err != nil {
		log.Fatalf("Failed to execute update: %v", err)
	}

	rows, _ := res.RowsAffected()
	log.Printf("Updated %d super_admin records", rows)
}
