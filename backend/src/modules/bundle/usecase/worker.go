package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

// Consumer starts consuming a queue with manual ack (implemented by factory.RabbitMQ).
type Consumer interface {
	Consume(queue string) (<-chan amqp.Delivery, error)
}

// Worker runs the "prepare this download" jobs, one at a time.
type Worker struct {
	uc       BundleUsecase
	consumer Consumer
}

func NewWorker(uc BundleUsecase, consumer Consumer) *Worker {
	return &Worker{uc: uc, consumer: consumer}
}

// Run consumes the queue until ctx is cancelled or the channel closes.
func (w *Worker) Run(ctx context.Context) error {
	deliveries, err := w.consumer.Consume(QueueBundle)
	if err != nil {
		return fmt.Errorf("bundle: consume %s: %w", QueueBundle, err)
	}

	for {
		select {
		case <-ctx.Done():
			return nil
		case d, ok := <-deliveries:
			if !ok {
				return fmt.Errorf("bundle: queue %s closed", QueueBundle)
			}
			w.handle(ctx, d)
		}
	}
}

func (w *Worker) handle(ctx context.Context, d amqp.Delivery) {
	var j job
	if err := json.Unmarshal(d.Body, &j); err != nil || j.RequestID == uuid.Nil {
		log.Printf("bundle: dropping malformed message: %v", err)
		_ = d.Reject(false)
		return
	}

	if err := w.uc.Prepare(ctx, j.RequestID); err != nil {
		log.Printf("bundle: request %s failed: %v", j.RequestID, err)
		if d.Redelivered {
			// second failure: give up and tell the student instead of retrying forever
			w.uc.Fail(ctx, j.RequestID, "Something went wrong while preparing it. Please try again.")
			_ = d.Ack(false)
			return
		}
		_ = d.Nack(false, true) // try once more
		return
	}
	_ = d.Ack(false)
}
