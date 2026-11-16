package repository

import (
	"context"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// bson field names allowed for sorting.
var notificationSortColumns = map[string]string{
	"id":         "_id",
	"user_id":    "user_id",
	"type":       "type",
	"header":     "header",
	"body":       "body",
	"is_read":    "is_read",
	"created_at": "created_at",
	"updated_at": "updated_at",
}

// buildNotificationFilter: id and user_id are exact matches; text fields are not filterable.
// A malformed id matches nothing.
func buildNotificationFilter(filters map[string]string) bson.M {
	f := bson.M{}
	for key, value := range filters {
		switch key {
		case "is_read":
			b, err := strconv.ParseBool(value)
			if err != nil {
				return bson.M{"_id": bson.M{"$exists": false}}
			}
			if b {
				f["is_read"] = true
			} else {
				// documents without the field count as unread
				f["is_read"] = bson.M{"$ne": true}
			}
		case "id", "user_id":
			id, err := uuid.Parse(value)
			if err != nil {
				return bson.M{"_id": bson.M{"$exists": false}}
			}
			field := "user_id"
			if key == "id" {
				field = "_id"
			}
			f[field] = id
		}
	}
	return f
}

const queryTimeout = 10 * time.Second

type notificationMongoRepository struct {
	col *mongo.Collection
}

func NewNotificationMongoRepository(col *mongo.Collection) NotificationRepository {
	return &notificationMongoRepository{col: col}
}

func (r *notificationMongoRepository) FindByUserID(userID string, params pagination.Params) ([]entity.Notification, pagination.Meta, error) {
	ctx, cancel := context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	uid, err := uuid.Parse(userID)
	if err != nil {
		return []entity.Notification{}, params.BuildMeta(0), nil
	}

	filter := buildNotificationFilter(params.Filters)
	filter["user_id"] = uid

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, pagination.Meta{}, err
	}

	sortField, ok := notificationSortColumns[params.Sort]
	if !ok {
		sortField = "created_at"
	}
	dir := -1
	if params.Order == "asc" {
		dir = 1
	}

	opts := options.Find().
		SetSort(bson.D{{Key: sortField, Value: dir}}).
		SetSkip(int64(params.GetOffset())).
		SetLimit(int64(params.PageSize))

	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, pagination.Meta{}, err
	}
	defer cur.Close(ctx)

	items := []entity.Notification{}
	if err := cur.All(ctx, &items); err != nil {
		return nil, pagination.Meta{}, err
	}

	return items, params.BuildMeta(total), nil
}

func (r *notificationMongoRepository) FindByID(id string) (*entity.Notification, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, mongo.ErrNoDocuments
	}

	ctx, cancel := context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var n entity.Notification
	if err := r.col.FindOne(ctx, bson.M{"_id": uid}).Decode(&n); err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *notificationMongoRepository) Create(n *entity.Notification) error {
	ctx, cancel := context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	now := time.Now()
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	n.CreatedAt = now
	n.UpdatedAt = now

	_, err := r.col.InsertOne(ctx, n)
	return err
}

func (r *notificationMongoRepository) CreateMany(items []entity.Notification) error {
	if len(items) == 0 {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	now := time.Now()
	docs := make([]interface{}, len(items))
	for i := range items {
		if items[i].ID == uuid.Nil {
			items[i].ID = uuid.New()
		}
		items[i].CreatedAt = now
		items[i].UpdatedAt = now
		docs[i] = items[i]
	}

	_, err := r.col.InsertMany(ctx, docs)
	return err
}

func (r *notificationMongoRepository) Update(n *entity.Notification) error {
	ctx, cancel := context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	n.UpdatedAt = time.Now()
	res, err := r.col.ReplaceOne(ctx, bson.M{"_id": n.ID}, n)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}
