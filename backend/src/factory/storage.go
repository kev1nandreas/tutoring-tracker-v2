package factory

import (
	"log"

	"context"
	"fmt"
	"github.com/google/uuid"
	"net/url"
	"time"

	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Storage wraps MinIO. Internal client does bucket ops; public client signs
// presigned URLs against the public host (signature is bound to the host).
type Storage struct {
	client         *minio.Client
	publicClient   *minio.Client
	bucket         string
	UploadExpiry   time.Duration
	DownloadExpiry time.Duration
}

func NewStorage(ctx context.Context) (*Storage, error) {
	endpoint := config.GetEnvString("MINIO_ENDPOINT", "localhost:9000")
	accessKey := config.GetEnvString("MINIO_ACCESS_KEY", "")
	secretKey := config.GetEnvString("MINIO_SECRET_KEY", "")
	bucket := config.GetEnvString("MINIO_BUCKET", "")
	useSSL := config.GetEnvBool("MINIO_USE_SSL", false)

	publicEndpoint := config.GetEnvString("MINIO_PUBLIC_ENDPOINT", endpoint)
	publicUseSSL := config.GetEnvBool("MINIO_PUBLIC_USE_SSL", useSSL)

	newClient := func(ep string, ssl bool) (*minio.Client, error) {
		return minio.New(ep, &minio.Options{
			Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
			Secure: ssl,
		})
	}

	client, err := newClient(endpoint, useSSL)
	if err != nil {
		return nil, fmt.Errorf("minio client: %w", err)
	}
	publicClient, err := newClient(publicEndpoint, publicUseSSL)
	if err != nil {
		return nil, fmt.Errorf("minio public client: %w", err)
	}

	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("minio bucket check: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("minio make bucket: %w", err)
		}
	}

	return &Storage{
		client:         client,
		publicClient:   publicClient,
		bucket:         bucket,
		UploadExpiry:   time.Duration(config.GetEnvInt("STORAGE_UPLOAD_URL_EXPIRY_MINUTES", 15)) * time.Minute,
		DownloadExpiry: time.Duration(config.GetEnvInt("STORAGE_DOWNLOAD_URL_EXPIRY_MINUTES", 60)) * time.Minute,
	}, nil
}

// Client returns the internal MinIO client for direct operations.
func (s *Storage) Client() *minio.Client { return s.client }

// Bucket returns the configured bucket name.
func (s *Storage) Bucket() string { return s.bucket }

// PresignedUploadURL returns a PUT URL valid for UploadExpiry.
func (s *Storage) PresignedUploadURL(ctx context.Context, objectKey string) (*url.URL, error) {
	return s.publicClient.PresignedPutObject(ctx, s.bucket, objectKey, s.UploadExpiry)
}

// PresignedDownloadURL returns a GET URL valid for DownloadExpiry.
func (s *Storage) PresignedDownloadURL(ctx context.Context, objectKey string) (*url.URL, error) {
	return s.publicClient.PresignedGetObject(ctx, s.bucket, objectKey, s.DownloadExpiry, nil)
}

// PresignedPost returns a browser form-upload (POST) target: the URL and the form fields
// to send before the file. MinIO itself enforces the key, the content type and the size
// range (1..maxBytes), so a client cannot upload anything else with this ticket.
func (s *Storage) PresignedPost(ctx context.Context, objectKey, contentType string, maxBytes int64) (*url.URL, map[string]string, error) {
	policy := minio.NewPostPolicy()
	if err := policy.SetBucket(s.bucket); err != nil {
		return nil, nil, err
	}
	if err := policy.SetKey(objectKey); err != nil {
		return nil, nil, err
	}
	if err := policy.SetExpires(time.Now().UTC().Add(s.UploadExpiry)); err != nil {
		return nil, nil, err
	}
	if err := policy.SetContentType(contentType); err != nil {
		return nil, nil, err
	}
	if err := policy.SetContentLengthRange(1, maxBytes); err != nil {
		return nil, nil, err
	}
	return s.publicClient.PresignedPostPolicy(ctx, policy)
}

// StatSize returns the size of a stored object, or an error if it does not exist.
func (s *Storage) StatSize(ctx context.Context, objectKey string) (int64, error) {
	info, err := s.client.StatObject(ctx, s.bucket, objectKey, minio.StatObjectOptions{})
	if err != nil {
		return 0, err
	}
	return info.Size, nil
}

// PresignedDownload returns a GET URL. The response headers are set from the
// arguments (not from whatever was stored), so inline vs attachment is decided here.
func (s *Storage) PresignedDownload(ctx context.Context, objectKey, filename, contentType string, inline bool) (*url.URL, error) {
	disposition := "attachment"
	if inline {
		disposition = "inline"
	}
	params := url.Values{}
	params.Set("response-content-disposition", fmt.Sprintf("%s; filename*=UTF-8''%s", disposition, url.PathEscape(filename)))
	params.Set("response-content-type", contentType)
	return s.publicClient.PresignedGetObject(ctx, s.bucket, objectKey, s.DownloadExpiry, params)
}

// Remove deletes an object (no error if it is already gone).
func (s *Storage) Remove(ctx context.Context, objectKey string) error {
	return s.client.RemoveObject(ctx, s.bucket, objectKey, minio.RemoveObjectOptions{})
}

// RemoveMeetingFiles deletes everything stored under the given meetings' prefixes
// (attached files and any upload that never completed). Failures are logged, not
// returned: the database rows are already gone, so a leftover file is only clutter.
func (s *Storage) RemoveMeetingFiles(ctx context.Context, meetingIDs []uuid.UUID) {
	for _, id := range meetingIDs {
		prefix := "meetings/" + id.String() + "/"
		objects := s.client.ListObjects(ctx, s.bucket, minio.ListObjectsOptions{Prefix: prefix, Recursive: true})
		for rerr := range s.client.RemoveObjects(ctx, s.bucket, objects, minio.RemoveObjectsOptions{}) {
			log.Printf("storage: could not remove %q under %s: %v", rerr.ObjectName, prefix, rerr.Err)
		}
	}
}
