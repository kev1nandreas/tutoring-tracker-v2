package dto

import (
	"github.com/google/uuid"
	"time"
)

type MeetingResponse struct {
	ID           uuid.UUID `json:"id"`
	TutorialID   uuid.UUID `json:"tutorial_id"`
	Title        string    `json:"title"`
	Date         time.Time `json:"date"`
	YoutubeLink  string    `json:"youtube_link"`
	TimeStart    time.Time `json:"time_start"`
	TimeEnd      time.Time `json:"time_end"`
	IsDone       bool      `json:"is_done"`
	Marks        string    `json:"marks"`
	HasHomework  bool      `json:"has_homework"`
	TextHomework string    `json:"text_homework"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
