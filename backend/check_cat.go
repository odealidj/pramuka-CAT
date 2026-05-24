package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	dsn := "postgres://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/pramukacat?sslmode=disable"
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, name, deleted_at FROM categories")
	if err != nil {
		log.Fatalf("Query error: %v", err)
	}
	defer rows.Close()

	fmt.Println("Categories:")
	for rows.Next() {
		var id int
		var name string
		var deletedAt sql.NullTime
		if err := rows.Scan(&id, &name, &deletedAt); err != nil {
			log.Fatalf("Scan error: %v", err)
		}
		if deletedAt.Valid {
			fmt.Printf("- %d: %s (DELETED)\n", id, name)
		} else {
			fmt.Printf("- %d: %s (ACTIVE)\n", id, name)
		}
	}
}
