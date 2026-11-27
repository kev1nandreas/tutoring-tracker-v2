package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/entity"
)

// Access is what decides whether a user may request a package.
type Access struct {
	TutorialName      string
	Owner             bool // the user is the tutor who created the tutorial
	Accepted          bool // the student was accepted into the tutorial
	ShowDownload      bool // the tutor turned on "download everything"
	IncludeRecordings bool
	IncludeHomework   bool
}

type Submission struct {
	SubmittedAt time.Time
	Answer      string
	Grade       *int
	Feedback    string
}

type File struct {
	Name string
	Type string
	Key  string // storage key
	Size int64
	// ZipName is the name the file gets inside its meeting folder (cleaned, unique). Set when the package is opened.
	ZipName string
}

type Meeting struct {
	ID          uuid.UUID
	Title       string
	Date        string // YYYY-MM-DD
	TimeStart   string // HH:MM
	TimeEnd     string
	IsDone      bool
	HasHomework bool
	Homework    string
	YoutubeLink string
	Submission  *Submission // the student's own, nil when none
	Files       []File      // stored files only; old external links are left out
}

// Plan is everything a package contains, for one student.
type Plan struct {
	TutorialName  string
	Code          string
	Description   string
	TutorName     string
	DateStarted   string
	DateEnded     string
	StudentName   string
	StudentSchool string
	Meetings      []Meeting // oldest first
}

type BundleRepository interface {
	// Access returns gorm.ErrRecordNotFound when the tutorial does not exist.
	Access(tutorialID, userID uuid.UUID) (*Access, error)
	// FindActive returns the user's newest request for the tutorial that is still queued,
	// preparing, or ready and not expired; gorm.ErrRecordNotFound when there is none.
	FindActive(tutorialID, userID uuid.UUID, now time.Time) (*entity.Request, error)
	FindByID(id uuid.UUID) (*entity.Request, error)
	Create(r *entity.Request) error
	Save(r *entity.Request) error
	Plan(tutorialID, userID uuid.UUID) (*Plan, error)
}
