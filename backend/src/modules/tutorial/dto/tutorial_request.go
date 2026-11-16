package dto

import "github.com/kev1nandreas/go-rest-api-template/src/shared/datetime"

type CreateTutorialRequest struct {
	Name           string        `json:"name" binding:"required"`
	DateStarted    datetime.Date `json:"date_started" binding:"required" swaggertype:"string" format:"date"`
	DateEnded      datetime.Date `json:"date_ended" binding:"required" swaggertype:"string" format:"date"`
	MeetingDays    int           `json:"meeting_days"`
	IsDone         bool          `json:"is_done"`
	Description    string        `json:"description"`
	ShowDownload   bool          `json:"show_download"`
	ShowAttendance bool          `json:"show_attendance"`
	ShowFeedback   bool          `json:"show_feedback"`
	// Download package contents; omitted means recordings off, homework on.
	BundleIncludeRecordings *bool `json:"bundle_include_recordings"`
	BundleIncludeHomework   *bool `json:"bundle_include_homework"`
}

type UpdateTutorialRequest struct {
	Name                    *string        `json:"name"`
	DateStarted             *datetime.Date `json:"date_started" swaggertype:"string" format:"date"`
	DateEnded               *datetime.Date `json:"date_ended" swaggertype:"string" format:"date"`
	MeetingDays             *int           `json:"meeting_days"`
	IsDone                  *bool          `json:"is_done"`
	Description             *string        `json:"description"`
	ShowDownload            *bool          `json:"show_download"`
	ShowAttendance          *bool          `json:"show_attendance"`
	ShowFeedback            *bool          `json:"show_feedback"`
	BundleIncludeRecordings *bool          `json:"bundle_include_recordings"`
	BundleIncludeHomework   *bool          `json:"bundle_include_homework"`
}
