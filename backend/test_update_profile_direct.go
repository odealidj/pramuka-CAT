package main

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/pkg/utils"
)

func main() {
	// Generate token directly for testing
	userID, _ := uuid.Parse("550e8400-e29b-41d4-a716-446655440000") // We don't know the exact UUID, let's query DB!
	
	fmt.Println("Test script running")
}
