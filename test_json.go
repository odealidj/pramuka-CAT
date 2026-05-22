package main
import (
	"encoding/json"
	"fmt"
	"time"
)
type X struct {
	EndTime time.Time `json:"end_time"`
}
func main() {
	t, _ := time.Parse(time.RFC3339, "2026-05-19T22:20:00Z")
	x := X{EndTime: t}
	b, _ := json.Marshal(x)
	fmt.Println(string(b))
}
