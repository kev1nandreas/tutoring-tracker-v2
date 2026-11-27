package usecase

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"
	"sync"
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

// ErrUsernameTaken is returned when the chosen username belongs to someone else.
var ErrUsernameTaken = errors.New("username is already taken")

func (u *userUsecase) CompleteProfile(callerUsername string, req dto.CompleteProfileRequest) (*dto.LoginResponse, error) {
	user, err := u.repo.FindByUsername(callerUsername)
	if err != nil {
		return nil, err
	}

	if req.Username != user.Username {
		if other, err := u.repo.FindByUsername(req.Username); err == nil && other.ID != user.ID {
			return nil, ErrUsernameTaken
		} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("could not check username")
		}
	}

	if email := strings.ToLower(strings.TrimSpace(req.Email)); email != "" && !strings.EqualFold(email, user.Email) {
		if taken, err := u.repo.ExistsByEmail(email); err != nil {
			return nil, errors.New("could not check email")
		} else if taken {
			return nil, ErrEmailTaken
		}
		user.Email = email
		// the new address is unproven: no more emails to it until it is verified
		user.EmailVerified = false
	}

	user.Name = req.Name
	user.School = req.School
	user.Phone = req.Phone
	user.Username = req.Username
	if err := u.repo.Update(user); err != nil {
		return nil, errors.New("could not save profile")
	}

	// the token carries the username, so it is reissued
	token, err := auth.GenerateToken(user.ID.String(), user.Username, user.Email, user.Role.Name)
	if err != nil {
		return nil, errors.New("error generating token")
	}
	return &dto.LoginResponse{Token: token, User: *toMeResponse(user)}, nil
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
	user.Password, user.PasswordUnset = hashed, false
	if err := u.repo.Update(user); err != nil {
		return errors.New("could not save password")
	}
	return nil
}

// ErrNoPassword is returned when a Google sign-up without its own password tries the email login.
var ErrNoPassword = errors.New("this account was created with Google and has no password yet. Sign in with Google, or use \"Forgot password\" to set one")

// ErrWrongPassword is returned when the current password given to change it does not match.
var ErrWrongPassword = errors.New("your current password is not correct")

// SetPassword sets the caller's password. A Google sign-up sets its first one without the
// current password (nobody knows it); everyone else must give the current one.
func (u *userUsecase) SetPassword(callerUsername string, req dto.SetPasswordRequest) (*dto.MeResponse, error) {
	user, err := u.repo.FindByUsername(callerUsername)
	if err != nil {
		return nil, err
	}
	if !user.PasswordUnset {
		if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)) != nil {
			return nil, ErrWrongPassword
		}
	}

	hashed, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return nil, errors.New("could not hash password")
	}
	user.Password, user.PasswordUnset = hashed, false
	if err := u.repo.Update(user); err != nil {
		return nil, errors.New("could not save password")
	}
	return toMeResponse(user), nil
}

// ErrGoogleDisabled is returned when Google login is not configured.
var ErrGoogleDisabled = errors.New("google login is not configured")

func (u *userUsecase) LoginWithGoogle(ctx context.Context, idToken string) (*dto.GoogleLoginResponse, error) {
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
		// no account yet: nothing is created until the person gives their details
		regToken, err := auth.GenerateGoogleRegisterToken(profile.Email, profile.Name)
		if err != nil {
			return nil, errors.New("could not start registration")
		}
		return &dto.GoogleLoginResponse{
			NeedsRegistration: true,
			RegistrationToken: regToken,
			Email:             profile.Email,
			Name:              profile.Name,
		}, nil
	}

	// Google proved this person controls the email
	if !user.EmailVerified {
		user.EmailVerified = true
		if err := u.repo.Update(user); err != nil {
			log.Printf("failed to mark email verified for user %s: %v", user.ID, err)
		}
	}

	resp, err := u.signIn(user)
	if err != nil {
		return nil, err
	}
	return &dto.GoogleLoginResponse{Token: resp.Token, User: &resp.User}, nil
}

// signIn records the login and issues the app token.
func (u *userUsecase) signIn(user *entity.User) (*dto.LoginResponse, error) {
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

// ErrRegistrationExpired is returned for a bad or expired Google registration token.
var ErrRegistrationExpired = errors.New("registration session is invalid or has expired")

func (u *userUsecase) RegisterWithGoogle(req dto.GoogleRegisterRequest) (*dto.LoginResponse, error) {
	email, _, err := auth.ParseGoogleRegisterToken(req.RegistrationToken)
	if err != nil {
		return nil, ErrRegistrationExpired
	}

	if taken, err := u.repo.ExistsByEmail(email); err != nil {
		return nil, errors.New("could not check email")
	} else if taken {
		return nil, ErrEmailTaken
	}
	if _, err := u.repo.FindByUsername(req.Username); err == nil {
		return nil, ErrUsernameTaken
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("could not check username")
	}

	role, err := u.repo.FindRoleByName(roleStudent)
	if err != nil {
		return nil, errors.New("student role not found")
	}
	// the account has no usable password: a random one nobody knows
	hashed, err := auth.HashPassword(auth.GenerateRandomKey())
	if err != nil {
		return nil, errors.New("could not hash password")
	}

	user := &entity.User{
		RoleID:   role.ID,
		Role:     *role,
		Name:     req.Name,
		School:   req.School,
		Phone:    req.Phone,
		Email:    email,
		Username: req.Username,
		Password: hashed,
		// Google checked the email
		EmailVerified:      true,
		EmailNotifications: true,
		PasswordUnset:      true,
	}
	if err := u.repo.Create(user); err != nil {
		return nil, errors.New("could not save user")
	}
	return u.signIn(user)
}

func (u *userUsecase) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	user, err := u.repo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		if user.PasswordUnset {
			return nil, ErrNoPassword
		}
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

var ErrForbidden = errors.New("only a tutor or an admin can register a tutor")

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

// RegisterTutor creates a tutor account. Only an existing tutor or an admin may do this.
func (u *userUsecase) RegisterTutor(callerUsername string, req dto.RegisterRequest) (*entity.User, error) {
	caller, err := u.repo.FindByUsername(callerUsername) // the role is preloaded
	if err != nil {
		return nil, ErrForbidden
	}
	if caller.Role.Name != roleTutor && caller.Role.Name != "admin" {
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
		ID:                 user.ID,
		Name:               user.Name,
		School:             user.School,
		Phone:              user.Phone,
		Email:              user.Email,
		Username:           user.Username,
		RoleID:             user.RoleID,
		Role:               user.Role.Name,
		ProfileComplete:    user.School != "" && user.Phone != "",
		EmailVerified:      user.EmailVerified,
		EmailNotifications: user.EmailNotifications,
		HasPassword:        !user.PasswordUnset,
		LastLoginAt:        user.LastLoginAt,
		CreatedAt:          user.CreatedAt,
	}
}

// ErrEmailNotVerified is returned when an action needs a verified email.
var ErrEmailNotVerified = errors.New("verify your email first")

// ErrAlreadyVerified is returned when the email is already verified.
var ErrAlreadyVerified = errors.New("email is already verified")

// ErrTooManyEmails is returned when a verification email was sent a moment ago.
var ErrTooManyEmails = errors.New("a verification email was just sent; wait a minute")

// ErrMailDisabled is returned when the server has no SMTP setup.
var ErrMailDisabled = errors.New("email sending is not configured")

const verifyCooldown = time.Minute

var (
	verifyMu   sync.Mutex
	verifySent = map[uuid.UUID]time.Time{}
)

// allowVerifyEmail enforces one verification email per user per minute.
func allowVerifyEmail(id uuid.UUID) bool {
	verifyMu.Lock()
	defer verifyMu.Unlock()
	if last, ok := verifySent[id]; ok && time.Since(last) < verifyCooldown {
		return false
	}
	verifySent[id] = time.Now()
	return true
}

func (u *userUsecase) SendVerificationEmail(callerUsername string) error {
	if u.mailer == nil {
		return ErrMailDisabled
	}
	user, err := u.repo.FindByUsername(callerUsername)
	if err != nil {
		return err
	}
	if user.EmailVerified {
		return ErrAlreadyVerified
	}
	if !allowVerifyEmail(user.ID) {
		return ErrTooManyEmails
	}

	token, err := auth.GenerateEmailVerifyToken(user.ID.String(), user.Email)
	if err != nil {
		return errors.New("could not create verification link")
	}
	link := u.frontendURL + "/verify-email?token=" + url.QueryEscape(token)
	text, html := mailer.Email{
		AppName:  "Tutoring Tracker",
		Title:    "Verify your email",
		Greeting: fmt.Sprintf("Hi %s,", user.Name),
		Paragraphs: []string{
			"Please confirm that this email address is yours. Once it is verified you can turn on email notifications in your settings.",
			fmt.Sprintf("The link expires in %d hours.", int(auth.EmailVerifyTTL.Hours())),
		},
		ButtonLabel: "Verify email",
		ButtonURL:   link,
		Footnote:    "If you did not create a Tutoring Tracker account, you can ignore this email.",
	}.Render()

	// synchronous: the user is waiting on this button and should see a failure
	if err := u.mailer.SendHTML(user.Email, "Verify your email", text, html); err != nil {
		log.Printf("verify email: send to user %s failed: %v", user.ID, err)
		return errors.New("could not send the email, try again later")
	}
	return nil
}

func (u *userUsecase) VerifyEmail(token string) error {
	userID, fingerprint, err := auth.ParseEmailVerifyToken(token)
	if err != nil {
		return ErrInvalidResetToken
	}
	user, err := u.repo.FindByID(userID)
	if err != nil || !auth.MatchesEmail(fingerprint, user.Email) {
		return ErrInvalidResetToken
	}
	if user.EmailVerified {
		return nil
	}
	user.EmailVerified = true
	if err := u.repo.Update(user); err != nil {
		return errors.New("could not save")
	}
	return nil
}

func (u *userUsecase) SetEmailNotifications(callerUsername string, enabled bool) (*dto.MeResponse, error) {
	user, err := u.repo.FindByUsername(callerUsername)
	if err != nil {
		return nil, err
	}
	if enabled && !user.EmailVerified {
		return nil, ErrEmailNotVerified
	}
	user.EmailNotifications = enabled
	if err := u.repo.Update(user); err != nil {
		return nil, errors.New("could not save")
	}
	return toMeResponse(user), nil
}
