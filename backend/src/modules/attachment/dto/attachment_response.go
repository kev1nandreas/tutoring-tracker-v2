package dto

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
)

// AttachmentResponse is an attachment without its storage key.
type AttachmentResponse struct {
	ID          uuid.UUID `json:"id"`
	MeetingID   uuid.UUID `json:"meeting_id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`
	ContentType string    `json:"content_type"`
	Size        int64     `json:"size"`
	// External is true for old rows that point at a web link instead of a stored file.
	External  bool      `json:"external"`
	CreatedAt time.Time `json:"created_at"`
}

func IsExternalLink(link string) bool {
	return strings.HasPrefix(link, "https://") || strings.HasPrefix(link, "http://")
}

func ToAttachmentResponse(a entity.Attachment) AttachmentResponse {
	return AttachmentResponse{
		ID:          a.ID,
		MeetingID:   a.MeetingID,
		Name:        a.Name,
		Type:        a.Type,
		ContentType: a.ContentType,
		Size:        a.Size,
		External:    IsExternalLink(a.Link),
		CreatedAt:   a.CreatedAt,
	}
}

// UploadTicket is what a client needs to upload one file straight to MinIO:
// POST multipart/form-data to UploadURL with every entry of Fields first, then the file.
type UploadTicket struct {
	UploadURL   string            `json:"upload_url"`
	Fields      map[string]string `json:"fields"`
	Key         string            `json:"key"`
	ContentType string            `json:"content_type"`
	ExpiresIn   int               `json:"expires_in"` // seconds
}

// DownloadResponse is a short-lived link to open or download an attachment.
type DownloadResponse struct {
	URL         string `json:"url"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	ContentType string `json:"content_type"`
	Inline      bool   `json:"inline"` // true when the browser can show it in place
	ExpiresIn   int    `json:"expires_in"`
}
