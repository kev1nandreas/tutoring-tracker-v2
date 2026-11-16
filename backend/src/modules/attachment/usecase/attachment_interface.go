package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type AttachmentUsecase interface {
	// FindByMeetingID lists a meeting's files. Tutor: own tutorial only. Student: accepted
	// students, and only when the tutor shares files. Admin: all.
	FindByMeetingID(meetingID string, callerID uuid.UUID, role string, params pagination.Params) ([]dto.AttachmentResponse, pagination.Meta, error)
	// PrepareUpload checks the file and returns a ticket to upload it straight to storage.
	PrepareUpload(ctx context.Context, meetingID string, callerID uuid.UUID, role string, req dto.UploadTicketRequest) (*dto.UploadTicket, error)
	// CompleteUploads saves files that were uploaded with a ticket.
	CompleteUploads(ctx context.Context, meetingID string, callerID uuid.UUID, role string, req dto.CompleteUploadsRequest) ([]dto.AttachmentResponse, error)
	// DownloadURL returns a short-lived link to open or download a file (same access as FindByMeetingID).
	DownloadURL(ctx context.Context, id string, callerID uuid.UUID, role string, wantInline bool) (*dto.DownloadResponse, error)
	// Delete removes a file; only the tutorial's tutor (or an admin).
	Delete(ctx context.Context, id string, callerID uuid.UUID, role string) error
}
