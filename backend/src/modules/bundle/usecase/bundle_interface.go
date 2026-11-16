package usecase

import (
	"context"
	"io"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/dto"
)

// Package is a zip ready to be written: nothing is built until Write is called.
type Package struct {
	FileName string
	Write    func(ctx context.Context, w io.Writer) error
}

type BundleUsecase interface {
	// Request asks for a package of a tutorial. The student must be accepted into it and
	// the tutor must have turned on downloads. An unfinished or still-valid request is
	// returned instead of creating another one (created is then false).
	Request(ctx context.Context, userID uuid.UUID, role, tutorialID string) (resp *dto.RequestResponse, created bool, err error)
	// Status returns one of the caller's requests, with a fresh download link when ready.
	Status(userID uuid.UUID, requestID string) (*dto.RequestResponse, error)
	// Prepare is the queue job: it checks the package and marks the request ready or failed.
	Prepare(ctx context.Context, requestID uuid.UUID) error
	// Fail marks a request as failed (used when the job gave up) and tells the student.
	Fail(ctx context.Context, requestID uuid.UUID, reason string)
	// Authorize checks a download link and returns the request and user it was issued for.
	Authorize(token string) (requestID, userID uuid.UUID, err error)
	// Open re-checks everything (still accepted, downloads still on, request still valid),
	// loads the data and returns the zip to write. Nothing is stored.
	Open(requestID, userID uuid.UUID) (*Package, error)
}
