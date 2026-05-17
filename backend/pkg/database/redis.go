package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// ConnectRedis membuka koneksi ke Redis menggunakan Environment Variables
func ConnectRedis() (*redis.Client, error) {
	host := os.Getenv("REDIS_HOST")
	port := os.Getenv("REDIS_PORT")
	password := os.Getenv("REDIS_PASSWORD")
	dbStr := os.Getenv("REDIS_DB")

	dbInt, err := strconv.Atoi(dbStr)
	if err != nil {
		dbInt = 0 // fallback ke DB 0 jika tidak diset
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       dbInt,
	})

	// Tes Ping ke redis
	ctx := context.Background()
	_, err = rdb.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("gagal terhubung ke redis: %w", err)
	}

	log.Println("Sukses terhubung ke Redis Cache")
	return rdb, nil
}
