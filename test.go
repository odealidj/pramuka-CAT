package main
import (
	"fmt"
	"go.opentelemetry.io/otel/exporters/prometheus"
)
func main() {
	_, _ = prometheus.New()
}
