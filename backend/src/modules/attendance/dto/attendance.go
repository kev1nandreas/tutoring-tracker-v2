package dto

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"
)

// MaxPhotoBytes is the largest attendance photo accepted.
const MaxPhotoBytes = 10 << 20

// photoTypes: what a phone camera or a screenshot produces, and what every browser can show.
var photoTypes = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
}

// Ext is the lower-case extension of a file name, with the dot.
func Ext(name string) string { return strings.ToLower(filepath.Ext(name)) }

// PhotoContentType returns the content type to store for a photo file name.
func PhotoContentType(name string) (string, error) {
	ct, ok := photoTypes[Ext(name)]
	if !ok {
		return "", fmt.Errorf("attendance photos must be .jpg, .png or .webp, not %q", Ext(name))
	}
	return ct, nil
}

// UploadTicketRequest asks for permission to upload an attendance photo.
type UploadTicketRequest struct {
	Name string `json:"name" binding:"required,max=100"`
	Size int64  `json:"size" binding:"required,gt=0"`
}

// UploadTicket: POST multipart/form-data to UploadURL with every entry of Fields first,
// then the file under the field "file".
type UploadTicket struct {
	UploadURL   string            `json:"upload_url"`
	Fields      map[string]string `json:"fields"`
	Key         string            `json:"key"`
	ContentType string            `json:"content_type"`
	ExpiresIn   int               `json:"expires_in"` // seconds
}

// MarkRequest saves the photo that was uploaded with a ticket.
type MarkRequest struct {
	Key string `json:"key" binding:"required"`
}

// MyAttendance is the caller's own check-in for a meeting.
type MyAttendance struct {
	Marked   bool       `json:"marked"`
	MarkedAt *time.Time `json:"marked_at,omitempty"`
	// PhotoURL is a short-lived link to the photo, only when marked.
	PhotoURL string `json:"photo_url,omitempty"`
	// CanMark is true on the meeting's day: the only day a check-in is accepted.
	CanMark bool `json:"can_mark"`
}

// StudentAttendance is one student on a meeting's roster.
type StudentAttendance struct {
	UserID   string     `json:"user_id"`
	Name     string     `json:"name"`
	Username string     `json:"username"`
	Present  bool       `json:"present"`
	MarkedAt *time.Time `json:"marked_at,omitempty"`
	PhotoURL string     `json:"photo_url,omitempty"`
}

// Roster is who checked in to a meeting, among the students accepted into its tutorial.
type Roster struct {
	Present  int                 `json:"present"`
	Total    int                 `json:"total"`
	Students []StudentAttendance `json:"students"`
}
