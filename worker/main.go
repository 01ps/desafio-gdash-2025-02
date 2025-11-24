package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherPayload struct {
	City                     string   `json:"city"`
	Lat                      float64  `json:"lat"`
	Lon                      float64  `json:"lon"`
	Temperature              float64  `json:"temperature"`
	Humidity                 float64  `json:"humidity"`
	WindSpeed                float64  `json:"wind_speed"`
	Condition                string   `json:"condition"`
	PrecipitationProbability *float64 `json:"precipitation_probability"`
	Source                   string   `json:"source"`
	CollectedAt              string   `json:"collected_at"`
}

type Config struct {
	RabbitURL string
	Queue     string
	NestURL   string
	APIKey    string
}

func loadConfig() Config {
	return Config{
		RabbitURL: getEnv("RABBIT_URL", "amqp://guest:guest@localhost:5672/"),
		Queue:     getEnv("RABBIT_QUEUE", "weather_readings"),
		NestURL:   strings.TrimSuffix(getEnv("NEST_API_URL", "http://localhost:3000"), "/"),
		APIKey:    getEnv("NEST_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func main() {
	cfg := loadConfig()
	log.Printf("worker starting, queue=%s, target=%s", cfg.Queue, cfg.NestURL)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	for {
		if err := consume(ctx, cfg); err != nil {
			log.Printf("consume loop error: %v; retrying in 5s", err)
			time.Sleep(5 * time.Second)
			continue
		}
		select {
		case <-ctx.Done():
			return
		default:
			time.Sleep(1 * time.Second)
		}
	}
}

func consume(ctx context.Context, cfg Config) error {
	conn, err := amqp.Dial(cfg.RabbitURL)
	if err != nil {
		return fmt.Errorf("connect rabbit: %w", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("channel: %w", err)
	}
	defer ch.Close()

	if err := ch.Qos(1, 0, false); err != nil {
		return fmt.Errorf("qos: %w", err)
	}

	deliveries, err := ch.Consume(
		cfg.Queue,
		"weather-worker",
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,
	)
	if err != nil {
		return fmt.Errorf("consume: %w", err)
	}

	for {
		select {
		case d, ok := <-deliveries:
			if !ok {
				return fmt.Errorf("deliveries channel closed")
			}
			if err := handleDelivery(cfg, d); err != nil {
				log.Printf("handler error, nack requeue: %v", err)
				_ = d.Nack(false, true)
				continue
			}
			_ = d.Ack(false)
		case <-ctx.Done():
			return nil
		}
	}
}

func handleDelivery(cfg Config, d amqp.Delivery) error {
	var payload WeatherPayload
	if err := json.Unmarshal(d.Body, &payload); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}
	payload.CollectedAt = normalizeTimestamp(payload.CollectedAt)
	if err := postToAPI(cfg, payload); err != nil {
		return err
	}
	return nil
}

func postToAPI(cfg Config, payload WeatherPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	endpoint := cfg.NestURL + "/weather/logs"
	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if cfg.APIKey != "" {
		req.Header.Set("x-internal-api-key", cfg.APIKey)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("post: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}

	log.Printf("sent payload to API, status=%d", resp.StatusCode)
	return nil
}

func normalizeTimestamp(ts string) string {
	if ts == "" {
		return ""
	}
	if strings.Contains(ts, "T") {
		return ts
	}
	layouts := []string{
		"2006-01-02 15:04:05.999999",
		"2006-01-02 15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, ts); err == nil {
			return t.UTC().Format(time.RFC3339)
		}
	}
	return ts
}
