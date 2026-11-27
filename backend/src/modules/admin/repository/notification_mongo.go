package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// NotificationCleaner removes a user's notifications, which live in MongoDB.
type NotificationCleaner interface {
	DeleteByUser(ctx context.Context, userID uuid.UUID) error
}

type notificationMongoCleaner struct{ col *mongo.Collection }

func NewNotificationMongoCleaner(col *mongo.Collection) NotificationCleaner {
	return &notificationMongoCleaner{col: col}
}

func (c *notificationMongoCleaner) DeleteByUser(ctx context.Context, userID uuid.UUID) error {
	if c.col == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	_, err := c.col.DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}
