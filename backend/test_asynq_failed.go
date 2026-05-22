package main

import (
	"fmt"
	"github.com/hibiken/asynq"
)

func main() {
	inspector := asynq.NewInspector(asynq.RedisClientOpt{Addr: "localhost:6379"})
	tasks, err := inspector.ListTasks("default", asynq.TaskStateFailed)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	for _, t := range tasks {
		fmt.Printf("Task %s: %s\nError: %s\n\n", t.ID, string(t.Payload), t.LastErr)
	}
}
