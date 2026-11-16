package usecase

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/auth"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/googleauth"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/mailer"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// GoogleVerifier checks a Google ID token (implemented by googleauth.Verifier).
type GoogleVerifier interface {
	Verify(ctx context.Context, idToken string) (*googleauth.Profile, error)
}

// Mailer sends an email with an HTML and a plain-text version (implemented by mailer.Mailer).
type Mailer interface {
	SendHTML(to, subject, text, html string) error
}

type userUsecase struct {
	repo        repository.UserRepository
	google      GoogleVerifier
	mailer      Mailer
	frontendURL string
}

// NewUserUsecase builds the usecase. google and mailer may be nil: Google login and
// password reset emails are then disabled. frontendURL is where reset links point.
func NewUserUsecase(repo repository.UserRepository, google GoogleVerifier, mailer Mailer, frontendURL string) UserUsecase {
	return &userUsecase{repo: repo, google: google, mailer: mailer, frontendURL: strings.TrimRight(frontendURL, "/")}
}

// ErrInvalidResetToken is returned for a bad, expired or already used reset link.
var ErrInvalidResetToken = errors.New("reset link is invalid or has expired")

func (u *userUsecase) ForgotPassword(email string) {
	if u.mailer == nil {
		log.Printf("forgot password: SMTP not configured, no email sent")
		return
	}
	user, err := u.repo.FindByEmail(email)
	if err != nil {
		return // unknown email: say nothing, to not reveal which emails have accounts
	}
	token, err := auth.GenerateResetToken(user.ID.String(), user.Password)
	if err != nil {
		log.Printf("forgot password: token for user %s: %v", user.ID, err)
		return
	}

	link := u.frontendURL + "/reset-password?reset_token=" + url.QueryEscape(token)
	text, html := mailer.Email{
		AppName:  "Tutoring Tracker",
		Title:    "Reset your password",
		Greeting: fmt.Sprintf("Hi %s,", user.Name),
		Paragraphs: []string{
			"We got a request to reset the password of your Tutoring Tracker account. Press the button below to choose a new one.",
			fmt.Sprintf("The link works once and expires in %d minutes.", int(auth.ResetTokenTTL.Minutes())),
		},
		ButtonLabel: "Reset password",
		ButtonURL:   link,
		Footnote:    "If you did not ask for this, you can ignore this email. Your password stays the same.",
	}.Render()

	// in the background: a slow mail server must not reveal (by timing) whether the email exists
	go func() {
		if err := u.mailer.SendHTML(user.Email, "Reset your password", text, html); err != nil {
			log.Printf("forgot password: email to user %s failed: %v", user.ID, err)
		}
	}()
}

func (u *userUsecase) ResetPassword(req dto.ResetPasswordRequest) error {
	userID, fingerprint, err := auth.ParseResetToken(req.Token)
	if err != nil {
		return ErrInvalidResetToken
	}
	user, err := u.repo.FindByID(userID)
	if err != nil || !auth.MatchesPassword(fingerprint, user.Password) {
		return ErrInvalidResetToken
	}

	hashed, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return errors.New("could not hash password")
	}
	user.Password = hashed
	if err := u.repo.Update(user); err != nil {
		return errors.New("could not save password")
	}
	return nil
}

// ErrGoogleDisabled is returned when Google login is not configured.
var ErrGoogleDisabled = errors.New("google login is not configured")

func (u *userUsecase) LoginWithGoogle(ctx context.Context, idToken string) (*dto.LoginResponse, error) {
	if u.google == nil {
		return nil, ErrGoogleDisabled
	}
	profile, err := u.google.Verify(ctx, idToken)
	if err != nil {
		return nil, err
	}

	user, err := u.repo.FindByEmail(profile.Email)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("could not look up user")
		}
		// first time with this email: create a student; school and phone are filled in later
		user, err = u.createGoogleStudent(profile)
		if err != nil {
			return nil, err
		}
	}

	if user.Role.Name == roleStudent {
		if err := u.repo.UpdateLastLogin(user.ID, time.Now()); err != nil {
			log.Printf("failed to update last login for user %s: %v", user.ID, err)
		}
	}

	token, err := auth.GenerateToken(user.ID.String(), user.Username, user.Email, user.Role.Name)
	if err != nil {
		return nil, errors.New("error generating token")
	}
	return &dto.LoginResponse{Token: token, User: *toMeResponse(user)}, nil
}

func (u *userUsecase) createGoogleStudent(p *googleauth.Profile) (*entity.User, error) {
	role, err := u.repo.FindRoleByName(roleStudent)
	if err != nil {
		return nil, errors.New("student role not found")
	}
	// the account has no usable password: a random one nobody knows
	hashed, err := auth.HashPassword(auth.GenerateRandomKey())
	if err != nil {
		return nil, errors.New("could not hash password")
	}

	name := p.Name
	if name == "" {
		name = strings.SplitN(p.Email, "@", 2)[0]
	}
	user := &entity.User{
		RoleID:   role.ID,
		Role:     *role,
		Name:     name,
		Email:    p.Email,
		Username: googleUsername(p.Email),
		Password: hashed,
	}
	if err := u.repo.Create(user); err != nil {
		return nil, errors.New("could not save user")
	}
	return user, nil
}

// googleUsername is the email's local part plus a random suffix (usernames are unique, max 50).
func googleUsername(email string) string {
	local := strings.SplitN(email, "@", 2)[0]
	if len(local) > 30 {
		local = local[:30]
	}
	return local + "-" + uuid.NewString()[:8]
}

func (u *userUsecase) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	user, err := u.repo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// track the last login of students; a failure here must not block logging in
	if user.Role.Name == roleStudent {
		if err := u.repo.UpdateLastLogin(user.ID, time.Now()); err != nil {
			log.Printf("failed to update last login for user %s: %v", user.ID, err)
		}
	}

	token, err := auth.GenerateToken(user.ID.String(), user.Username, user.Email, user.Role.Name)
	if err != nil {
		return nil, errors.New("error generating token")
	}

	return &dto.LoginResponse{Token: token, User: *toMeResponse(user)}, nil
}

const (
	roleStudent = "student"
	roleTutor   = "tutor"
)

// ErrForbidden is returned when the caller is not allowed to perform the action.
// ErrEmailTaken is returned when registering an email that is already in use.
var ErrEmailTaken = errors.New("email is already registered")

var ErrForbidden = errors.New("only a tutor can register a tutor")

// Me returns the profile (id and role included) of the user from the token.
func (u *userUsecase) Me(username string) (*dto.MeResponse, error) {
	user, err := u.repo.FindByUsername(username)
	if err != nil {
		return nil, err
	}
	return toMeResponse(user), nil
}

// Register creates a public account; the role is always student.
func (u *userUsecase) Register(req dto.RegisterRequest) (*entity.User, error) {
	return u.createWithRole(roleStudent, req)
}

// RegisterTutor creates a tutor account. Only an existing tutor may do this.
func (u *userUsecase) RegisterTutor(callerUsername string, req dto.RegisterRequest) (*entity.User, error) {
	caller, err := u.repo.FindByUsername(callerUsername)
	if err != nil {
		return nil, ErrForbidden
	}
	tutorRole, err := u.repo.FindRoleByName(roleTutor)
	if err != nil {
		return nil, errors.New("tutor role not found")
	}
	if caller.RoleID != tutorRole.ID {
		return nil, ErrForbidden
	}

	return u.createWithRole(roleTutor, req)
}

func (u *userUsecase) createWithRole(roleName string, req dto.RegisterRequest) (*entity.User, error) {
	role, err := u.repo.FindRoleByName(roleName)
	if err != nil {
		return nil, errors.New(roleName + " role not found")
	}

	// Login is by email, so an email must belong to exactly one account.
	if taken, err := u.repo.ExistsByEmail(req.Email); err != nil {
		return nil, errors.New("could not check email")
	} else if taken {
		return nil, ErrEmailTaken
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("could not hash password")
	}

	user := &entity.User{
		RoleID:   role.ID,
		Name:     req.Name,
		School:   req.School,
		Phone:    req.Phone,
		Email:    req.Email,
		Username: req.Username,
		Password: hashedPassword,
	}

	if err := u.repo.Create(user); err != nil {
		return nil, errors.New("could not save user")
	}

	return user, nil
}

func (u *userUsecase) FindAll(params pagination.Params) ([]entity.User, pagination.Meta, error) {
	return u.repo.FindAll(params)
}

func (u *userUsecase) FindByID(id string) (*entity.User, error) {
	return u.repo.FindByID(id)
}

func (u *userUsecase) Update(id string, req dto.UpdateUserRequest) (*entity.User, error) {
	user, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.RoleID != nil {
		user.RoleID = *req.RoleID
	}
	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.School != nil {
		user.School = *req.School
	}
	if req.Phone != nil {
		user.Phone = *req.Phone
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Password != nil {
		hashed, err := auth.HashPassword(*req.Password)
		if err != nil {
			return nil, errors.New("could not hash password")
		}
		user.Password = hashed
	}

	if err := u.repo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (u *userUsecase) Delete(id string) error {
	user, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}

	return u.repo.Delete(user)
}

func toMeResponse(user *entity.User) *dto.MeResponse {
	return &dto.MeResponse{
		ID:          user.ID,
		Name:        user.Name,
		School:      user.School,
		Phone:       user.Phone,
		Email:       user.Email,
		Username:    user.Username,
		RoleID:      user.RoleID,
		Role:        user.Role.Name,
		LastLoginAt: user.LastLoginAt,
		CreatedAt:   user.CreatedAt,
	}
}
