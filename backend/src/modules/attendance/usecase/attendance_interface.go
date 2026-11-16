package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/dto"
)

type AttendanceUsecase interface {
	// PrepareUpload (student) checks the photo and returns a ticket to upload it to storage.
	PrepareUpload(ctx context.Context, meetingID string, userID uuid.UUID, role string, req dto.UploadTicketRequest) (*dto.UploadTicket, error)
	// Mark (student) saves the uploaded photo as the check-in, replacing an earlier one.
	Mark(ctx context.Context, meetingID string, userID uuid.UUID, role string, req dto.MarkRequest) (*dto.MyAttendance, error)
	// Mine (student) returns the caller's own check-in.
	Mine(ctx context.Context, meetingID string, userID uuid.UUID, role string) (*dto.MyAttendance, error)
	// Roster (tutor of the tutorial, or admin) lists who checked in.
	Roster(ctx context.Context, meetingID string, userID uuid.UUID, role string) (*dto.Roster, error)
}
