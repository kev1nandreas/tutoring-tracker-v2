package dto

import "github.com/google/uuid"

type EnrollRequest struct {
	TutorialCode string `json:"tutorial_code" binding:"required"`
}

type ValidateRequest struct {
	TutorialCode string      `json:"tutorial_code" binding:"required"`
	UserIDs      []uuid.UUID `json:"user_ids" binding:"required,min=1"`
	Action       string      `json:"action" binding:"required,oneof=accept decline"`
}
