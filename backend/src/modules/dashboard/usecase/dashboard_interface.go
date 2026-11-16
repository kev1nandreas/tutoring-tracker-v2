package usecase

import "github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/dto"

type DashboardUsecase interface {
	// isAdmin: see every tutorial instead of only the ones tutorID created.
	Tutor(tutorID string, isAdmin bool) (*dto.TutorDashboard, error)
	Student(userID string) (*dto.StudentDashboard, error)
}
