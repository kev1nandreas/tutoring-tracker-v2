package dto

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/datetime"
)

// Date is "YYYY-MM-DD"; TimeStart/TimeEnd are "HH:MM" in the app timezone.
type CreateMeetingRequest struct {
	TutorialID   uuid.UUID      `json:"tutorial_id" binding:"required"`
	Title        string         `json:"title" binding:"required"`
	Date         datetime.Date  `json:"date" binding:"required" swaggertype:"string" format:"date"`
	YoutubeLink  string         `json:"youtube_link"`
	TimeStart    datetime.Clock `json:"time_start" binding:"required" swaggertype:"string" example:"16:00"`
	TimeEnd      datetime.Clock `json:"time_end" binding:"required" swaggertype:"string" example:"17:30"`
	IsDone       bool           `json:"is_done"`
	Marks        string         `json:"marks"`
	HasHomework  bool           `json:"has_homework"`
	TextHomework string         `json:"text_homework"`
}

type UpdateMeetingRequest struct {
	Title        *string         `json:"title"`
	Date         *datetime.Date  `json:"date" swaggertype:"string" format:"date"`
	YoutubeLink  *string         `json:"youtube_link"`
	TimeStart    *datetime.Clock `json:"time_start" swaggertype:"string" example:"16:00"`
	TimeEnd      *datetime.Clock `json:"time_end" swaggertype:"string" example:"17:30"`
	IsDone       *bool           `json:"is_done"`
	Marks        *string         `json:"marks"`
	HasHomework  *bool           `json:"has_homework"`
	TextHomework *string         `json:"text_homework"`
}
