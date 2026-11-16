package usecase

import (
	"time"

	"github.com/kev1nandreas/go-rest-api-template/src/shared/cache"

	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/repository"
)

const (
	listLimit = 5
	// Dashboards also depend on the time of day (a meeting that started drops out of
	// "upcoming" without any write), so they get a short TTL. Writes still invalidate
	// them right away (see cache.RegisterInvalidation).
	dashboardTTL = 5 * time.Minute
)

type dashboardUsecase struct {
	repo  repository.DashboardRepository
	loc   *time.Location
	cache *cache.Cache
}

// NewDashboardUsecase builds the usecase. cache may be nil (no caching).
func NewDashboardUsecase(repo repository.DashboardRepository, c *cache.Cache) DashboardUsecase {
	loc, err := time.LoadLocation(config.GetEnvString("APP_TIMEZONE", "Asia/Jakarta"))
	if err != nil {
		loc = time.UTC
	}
	return &dashboardUsecase{repo: repo, loc: loc, cache: c}
}

func (u *dashboardUsecase) clock() repository.Clock {
	now := time.Now().In(u.loc)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, u.loc)
	yearStart := time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, u.loc)

	return repository.Clock{
		Today:      now.Format("2006-01-02"),
		Time:       now.Format("15:04:05"),
		MonthStart: monthStart.Unix(),
		NextMonth:  monthStart.AddDate(0, 1, 0).Unix(),
		YearStart:  yearStart.Unix(),
		NextYear:   yearStart.AddDate(1, 0, 0).Unix(),
	}
}

func (u *dashboardUsecase) Tutor(tutorID string, isAdmin bool) (*dto.TutorDashboard, error) {
	owner := tutorID
	if isAdmin {
		owner = ""
	}
	c := u.clock()
	return cache.Remember(u.cache, cache.NSDashboard, "tutor:"+owner+":"+c.Today, dashboardTTL,
		func() (*dto.TutorDashboard, error) { return u.buildTutor(owner, c) })
}

func (u *dashboardUsecase) buildTutor(owner string, c repository.Clock) (*dto.TutorDashboard, error) {
	upcoming, err := u.repo.UpcomingMeetings(owner, c, listLimit)
	if err != nil {
		return nil, err
	}
	active, err := u.repo.ActiveTutorials(owner, c)
	if err != nil {
		return nil, err
	}
	income, err := u.repo.Income(owner, c)
	if err != nil {
		return nil, err
	}
	income.Month = time.Unix(c.MonthStart, 0).In(u.loc).Format("2006-01")
	income.Year = time.Unix(c.YearStart, 0).In(u.loc).Year()

	pending, err := u.repo.PendingAttachments(owner, c, 10)
	if err != nil {
		return nil, err
	}

	return &dto.TutorDashboard{
		UpcomingMeetings:   upcoming,
		ActiveTutorials:    active,
		Income:             income,
		PendingAttachments: pending,
	}, nil
}

func (u *dashboardUsecase) Student(userID string) (*dto.StudentDashboard, error) {
	c := u.clock()
	return cache.Remember(u.cache, cache.NSDashboard, "student:"+userID+":"+c.Today, dashboardTTL,
		func() (*dto.StudentDashboard, error) { return u.buildStudent(userID, c) })
}

func (u *dashboardUsecase) buildStudent(userID string, c repository.Clock) (*dto.StudentDashboard, error) {
	homework, err := u.repo.PendingHomework(userID, c, 10)
	if err != nil {
		return nil, err
	}
	upcoming, err := u.repo.UpcomingTutorials(userID, c, listLimit)
	if err != nil {
		return nil, err
	}
	enrolled, err := u.repo.EnrolledTutorials(userID, c)
	if err != nil {
		return nil, err
	}

	return &dto.StudentDashboard{
		PendingHomework:   homework,
		UpcomingTutorials: upcoming,
		EnrolledTutorials: enrolled,
	}, nil
}
