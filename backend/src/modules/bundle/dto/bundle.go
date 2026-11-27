package dto

import "time"

// RequestResponse is a download request as its requester sees it.
type RequestResponse struct {
	ID string `json:"id"`
	// Status is queued, preparing, ready, failed or expired.
	Status     string     `json:"status"`
	FileCount  int        `json:"file_count"`
	TotalBytes int64      `json:"total_bytes"`
	Error      string     `json:"error,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	// DownloadURL is a short-lived link, present only while status is ready.
	DownloadURL string `json:"download_url,omitempty"`
	// What this package holds.
	IncludeAttachments bool `json:"include_attachments"`
	IncludeHomework    bool `json:"include_homework"`
	IncludeRecordings  bool `json:"include_recordings"`
}

// Options is what a tutor picks for their own download of a class.
type Options struct {
	IncludeAttachments bool `json:"include_attachments"`
	IncludeHomework    bool `json:"include_homework"`
	IncludeRecordings  bool `json:"include_recordings"`
}
