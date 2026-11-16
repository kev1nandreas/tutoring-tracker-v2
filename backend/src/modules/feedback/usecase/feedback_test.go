package usecase

import (
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/repository"
)

type fakeRepo struct {
	info     repository.TutorialInfo
	stored   []entity.Feedback
	accepted bool
	tutors   map[uuid.UUID]bool
}

func (f *fakeRepo) TutorialByCode(string) (*repository.TutorialInfo, error) {
	i := f.info
	return &i, nil
}
func (f *fakeRepo) TutorialByID(uuid.UUID) (*repository.TutorialInfo, error) {
	i := f.info
	return &i, nil
}
func (f *fakeRepo) UserEmail(uuid.UUID) (string, error)            { return "Ann@Example.com", nil }
func (f *fakeRepo) IsAcceptedStudent(_, _ uuid.UUID) (bool, error) { return f.accepted, nil }
func (f *fakeRepo) IsTutor(_, u uuid.UUID) (bool, error)           { return f.tutors[u], nil }
func (f *fakeRepo) List(uuid.UUID) ([]entity.Feedback, error)      { return f.stored, nil }
func (f *fakeRepo) Exists(_ uuid.UUID, h string) (bool, error) {
	for _, s := range f.stored {
		if s.RespondentHash == h {
			return true, nil
		}
	}
	return false, nil
}
func (f *fakeRepo) Create(x *entity.Feedback) error {
	if ok, _ := f.Exists(x.TutorialID, x.RespondentHash); ok {
		return repository.ErrDuplicate
	}
	f.stored = append(f.stored, *x)
	return nil
}

func req(email string) dto.SubmitRequest {
	return dto.SubmitRequest{Email: email, DeliveryRating: 5, InteractiveRating: 4, LearnAgainRating: 3, UnclearTopics: "fractions", Message: "good"}
}

func TestSubmitOnceAndAnonymous(t *testing.T) {
	repo := &fakeRepo{info: repository.TutorialInfo{ID: uuid.New(), IsDone: true, ShowFeedback: true}}
	uc := NewFeedbackUsecase(repo)

	if err := uc.Submit("ABC123", req("ann@example.com")); err != nil {
		t.Fatal(err)
	}
	// same person, different case and spacing: still the same respondent
	if err := uc.Submit("ABC123", req(" ANN@example.com ")); !errors.Is(err, ErrAlreadySubmitted) {
		t.Fatalf("second submit: %v", err)
	}
	if err := uc.Submit("ABC123", req("bob@example.com")); err != nil {
		t.Fatal(err)
	}
	for _, s := range repo.stored {
		if strings.Contains(s.RespondentHash, "example") || len(s.RespondentHash) != 64 {
			t.Fatalf("hash leaks or is malformed: %q", s.RespondentHash)
		}
	}
}

func TestClosedUntilDoneAndSwitchOn(t *testing.T) {
	repo := &fakeRepo{info: repository.TutorialInfo{ID: uuid.New(), IsDone: true, ShowFeedback: false}}
	uc := NewFeedbackUsecase(repo)
	if err := uc.Submit("ABC123", req("a@b.co")); !errors.Is(err, ErrClosed) {
		t.Fatalf("switch off: %v", err)
	}
	repo.info.ShowFeedback, repo.info.IsDone = true, false
	if err := uc.Submit("ABC123", req("a@b.co")); !errors.Is(err, ErrClosed) {
		t.Fatalf("not done: %v", err)
	}
}

func TestStatusBlocksStudentUntilSubmitted(t *testing.T) {
	repo := &fakeRepo{accepted: true, info: repository.TutorialInfo{ID: uuid.New(), CustomID: "ABC123", IsDone: true, ShowFeedback: true}}
	uc := NewFeedbackUsecase(repo)
	student := uuid.New()

	st, _ := uc.Status(repo.info.ID.String(), student, "student")
	if !st.Required || st.Code != "ABC123" {
		t.Fatalf("should be required: %+v", st)
	}
	// the student's account email (any case) is what counts, so the public form with that email unlocks it
	if err := uc.Submit("ABC123", req("ann@example.com")); err != nil {
		t.Fatal(err)
	}
	if st, _ := uc.Status(repo.info.ID.String(), student, "student"); st.Required {
		t.Fatal("still locked after submitting")
	}
	if st, _ := uc.Status(repo.info.ID.String(), student, "tutor"); st.Required {
		t.Fatal("tutors are never locked")
	}
}

func TestSummaryOnlyForTutorsOfTheTutorial(t *testing.T) {
	tutor := uuid.New()
	repo := &fakeRepo{tutors: map[uuid.UUID]bool{tutor: true}, info: repository.TutorialInfo{ID: uuid.New(), IsDone: true, ShowFeedback: true}}
	uc := NewFeedbackUsecase(repo)
	_ = uc.Submit("ABC123", req("a@b.co"))
	_ = uc.Submit("ABC123", dto.SubmitRequest{Email: "c@d.co", DeliveryRating: 3, InteractiveRating: 4, LearnAgainRating: 5, UnclearTopics: "x", Message: "y"})

	s, err := uc.Summary(repo.info.ID.String(), tutor, "tutor")
	if err != nil || s.Count != 2 || s.AvgDelivery != 4 || s.AvgInteractive != 4 || s.AvgLearnAgain != 4 {
		t.Fatalf("summary: %+v %v", s, err)
	}
	if _, err := uc.Summary(repo.info.ID.String(), uuid.New(), "tutor"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("other tutor: %v", err)
	}
	if _, err := uc.Summary(repo.info.ID.String(), tutor, "student"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("student: %v", err)
	}
}
