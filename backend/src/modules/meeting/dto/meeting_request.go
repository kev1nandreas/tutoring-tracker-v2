package dto

import (
	"github.com/google/uuid"
	"time"
)

type CreateMeetingRequest struct {
	TutorialID   uuid.UUID `json:"tutorial_id" binding:"required"`
	Title        string    `json:"title" binding:"required"`
	Date         time.Time `json:"date" binding:"required"`
	YoutubeLink  string    `json:"youtube_link" binding:"required"`
	TimeStart    time.Time `json:"time_start" binding:"required"`
	TimeEnd      time.Time `json:"time_end" binding:"required"`
	IsDone       bool      `json:"is_done"`
	Marks        string    `json:"marks"`
	HasHomework  bool      `json:"has_homework"`
	TextHomework string    `json:"text_homework"`
}

type UpdateMeetingRequest struct {
	TutorialID   *uuid.UUID `json:"tutorial_id"`
	Title        *string    `json:"title"`
	Date         *time.Time `json:"date"`
	YoutubeLink  *string    `json:"youtube_link"`
	TimeStart    *time.Time `json:"time_start"`
	TimeEnd      *time.Time `json:"time_end"`
	IsDone       *bool      `json:"is_done"`
	Marks        *string    `json:"marks"`
	HasHomework  *bool      `json:"has_homework"`
	TextHomework *string    `json:"text_homework"`
}
