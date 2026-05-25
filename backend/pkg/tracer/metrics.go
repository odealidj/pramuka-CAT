package tracer

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/host"
	"go.opentelemetry.io/contrib/instrumentation/runtime"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/stdout/stdoutmetric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
)

// InitMetrics menginisialisasi OpenTelemetry MeterProvider dengan Stdout exporter
// Setiap 10 detik, metrik hardware (CPU/RAM) dan runtime (GC/Goroutines) akan dicetak ke terminal
func InitMetrics(ctx context.Context, serviceName string) (shutdown func(context.Context) error, err error) {
	// 1. Buat exporter ke terminal (stdout)
	// Kita set pretty print agar JSON-nya mudah dibaca
	exporter, err := stdoutmetric.New(stdoutmetric.WithPrettyPrint())
	if err != nil {
		return nil, fmt.Errorf("gagal membuat stdout metric exporter: %w", err)
	}

	// 2. Definisikan resource (identitas service)
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.ServiceVersion("1.0.0"),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat OTEL metric resource: %w", err)
	}

	// 3. Buat MeterProvider dengan Reader periodik (10 detik)
	// Ini akan mengumpulkan dan mencetak data metrik setiap 10 detik
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(exporter,
			sdkmetric.WithInterval(10*time.Second),
		)),
	)

	// 4. Set sebagai global MeterProvider
	otel.SetMeterProvider(mp)

	// 5. Inisialisasi otomatis untuk metrik Runtime Golang (Memory, GC, Goroutines)
	if err := runtime.Start(runtime.WithMinimumReadMemStatsInterval(10 * time.Second)); err != nil {
		log.Printf("Peringatan: Gagal menjalankan instrumentasi runtime Go: %v", err)
	}

	// 6. Inisialisasi otomatis untuk metrik Host OS (CPU, RAM fisik, Network)
	if err := host.Start(); err != nil {
		log.Printf("Peringatan: Gagal menjalankan instrumentasi Host OS: %v", err)
	}

	log.Println("Metrik OpenTelemetry aktif → mengekspor ke Terminal setiap 10 detik")

	// Kembalikan fungsi shutdown
	shutdown = func(ctx context.Context) error {
		shutdownCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		return mp.Shutdown(shutdownCtx)
	}

	return shutdown, nil
}
