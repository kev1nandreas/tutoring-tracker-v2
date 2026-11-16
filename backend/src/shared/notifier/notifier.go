// Package notifier turns domain events into notifications through a message queue:
// callers publish one small job, a background worker fans it out to the students.
package notifier

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	jobEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/job/entity"
	meetingEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	tutorialEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	amqp "github.com/rabbitmq/amqp091-go"
	"gorm.io/gorm"
)

const (
	// QueueMaterial is the queue holding "material added to a meeting" jobs.
	QueueMaterial = "notification.meeting_material"

	// TypeMaterial is the notification type used when new material is added to a meeting.
	TypeMaterial = "material"

	publishTimeout = 5 * time.Second
	maxMessageLen  = 300 // jobs.messages column size
)

// Publisher puts a JSON message on a queue (implemented by factory.RabbitMQ).
type Publisher interface {
	PublishJSON(ctx context.Context, queue string, v any) error
}

// Consumer starts consuming a queue with manual ack (implemented by factory.RabbitMQ).
type Consumer interface {
	Consume(queue string) (<-chan amqp.Delivery, error)
}

// Sender delivers one notification to many users (implemented by the notification usecase).
type Sender interface {
	NotifyUsers(userIDs []uuid.UUID, notificationType, header, body string) error
}

// materialJob is the queue message: one job per addition of material.
type materialJob struct {
	MeetingID uuid.UUID `json:"meeting_id"`
	Count     int       `json:"count"`
}

// Notifier is the producer side: it only enqueues.
type Notifier struct {
	publisher Publisher
	mu        sync.Mutex // an AMQP channel must not publish concurrently
}

func NewNotifier(publisher Publisher) *Notifier {
	return &Notifier{publisher: publisher}
}

// MeetingMaterialAdded enqueues one job telling the students of the meeting's tutorial
// that count materials were added. Call it after the material is saved. It is best
// effort: a failure is logged and never fails the caller.
func (n *Notifier) MeetingMaterialAdded(meetingID uuid.UUID, count int) {
	ctx, cancel := context.WithTimeout(context.Background(), publishTimeout)
	defer cancel()

	n.mu.Lock()
	defer n.mu.Unlock()

	if err := n.publisher.PublishJSON(ctx, QueueMaterial, materialJob{MeetingID: meetingID, Count: count}); err != nil {
		log.Printf("notifier: failed to enqueue material job for meeting %s: %v", meetingID, err)
	}
}

// Worker is the consumer side: it turns each job into notifications and records the
// run in the jobs table.
type Worker struct {
	db       *gorm.DB
	consumer Consumer
	sender   Sender
}

func NewWorker(db *gorm.DB, consumer Consumer, sender Sender) *Worker {
	return &Worker{db: db, consumer: consumer, sender: sender}
}

// Run consumes the queue until ctx is cancelled or the channel closes.
func (w *Worker) Run(ctx context.Context) error {
	deliveries, err := w.consumer.Consume(QueueMaterial)
	if err != nil {
		return fmt.Errorf("notifier: consume %s: %w", QueueMaterial, err)
	}

	for {
		select {
		case <-ctx.Done():
			return nil
		case d, ok := <-deliveries:
			if !ok {
				return fmt.Errorf("notifier: queue %s closed", QueueMaterial)
			}
			w.handle(d)
		}
	}
}

func (w *Worker) handle(d amqp.Delivery) {
	var job materialJob
	if err := json.Unmarshal(d.Body, &job); err != nil || job.MeetingID == uuid.Nil {
		log.Printf("notifier: dropping malformed message: %v", err)
		_ = d.Reject(false)
		return
	}

	start := time.Now()
	sent, err := w.notifyMeetingMaterial(job)
	w.recordJob(job, sent, start, err)

	if err != nil {
		log.Printf("notifier: meeting %s failed: %v", job.MeetingID, err)
		// retry once; a message that already came back once is dropped
		_ = d.Nack(false, !d.Redelivered)
		return
	}
	_ = d.Ack(false)
}

func (w *Worker) notifyMeetingMaterial(job materialJob) (int, error) {
	var meeting meetingEntity.Meeting
	if err := w.db.Preload("Tutorial").Where("id = ?", job.MeetingID).First(&meeting).Error; err != nil {
		return 0, err
	}

	var studentIDs []uuid.UUID
	if err := w.db.Model(&tutorialEntity.TutorialStudent{}).
		Where("tutorial_id = ?", meeting.TutorialID).
		Pluck("user_id", &studentIDs).Error; err != nil {
		return 0, err
	}
	if len(studentIDs) == 0 {
		return 0, nil
	}

	subject := "A new material was"
	if job.Count > 1 {
		subject = fmt.Sprintf("%d new materials were", job.Count)
	}
	body := fmt.Sprintf("%s added to meeting \"%s\" in %s.", subject, meeting.Title, meeting.Tutorial.Name)

	if err := w.sender.NotifyUsers(studentIDs, TypeMaterial, "New material", body); err != nil {
		return 0, err
	}
	return len(studentIDs), nil
}

// recordJob stores one row per run in the jobs table (EndTime is the duration in ms).
func (w *Worker) recordJob(job materialJob, sent int, start time.Time, runErr error) {
	msg := fmt.Sprintf("material notification, meeting %s: notified %d students", job.MeetingID, sent)
	if runErr != nil {
		msg = fmt.Sprintf("material notification, meeting %s failed: %v", job.MeetingID, runErr)
	}
	if len(msg) > maxMessageLen {
		msg = msg[:maxMessageLen]
	}

	row := jobEntity.Job{
		IsSuccess: runErr == nil,
		Messages:  msg,
		StartTime: start,
		EndTime:   int(time.Since(start).Milliseconds()),
	}
	if err := w.db.Create(&row).Error; err != nil {
		log.Printf("notifier: failed to record job: %v", err)
	}
}
