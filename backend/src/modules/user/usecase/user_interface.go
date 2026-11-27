package usecase

import (
	"context"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type UserUsecase interface {
	Login(req dto.LoginRequest) (*dto.LoginResponse, error)
	// LoginWithGoogle signs in the owner of a verified Google email. An email with no account
	// yet is not created: the answer asks the caller to finish the registration form.
	LoginWithGoogle(ctx context.Context, idToken string) (*dto.GoogleLoginResponse, error)
	// RegisterWithGoogle creates the student account for a Google-verified email and signs it in.
	RegisterWithGoogle(req dto.GoogleRegisterRequest) (*dto.LoginResponse, error)
	// ForgotPassword emails a reset link when the email has an account. It never reveals whether it does.
	ForgotPassword(email string)
	// ResetPassword sets a new password using the token from the emailed link.
	ResetPassword(req dto.ResetPasswordRequest) error
	// CompleteProfile saves the caller's identity. The username may change, so a new token comes back.
	CompleteProfile(callerUsername string, req dto.CompleteProfileRequest) (*dto.LoginResponse, error)
	// SendVerificationEmail mails a verification link to the caller's current email.
	SendVerificationEmail(callerUsername string) error
	// VerifyEmail marks the email in the link as verified.
	VerifyEmail(token string) error
	// SetEmailNotifications turns the emailed copies of notifications on or off. Turning on needs a verified email.
	SetEmailNotifications(callerUsername string, enabled bool) (*dto.MeResponse, error)
	// SetPassword sets or changes the caller's password (see dto.SetPasswordRequest).
	SetPassword(callerUsername string, req dto.SetPasswordRequest) (*dto.MeResponse, error)
	Me(username string) (*dto.MeResponse, error)
	Register(req dto.RegisterRequest) (*entity.User, error)
	RegisterTutor(callerUsername string, req dto.RegisterRequest) (*entity.User, error)
	FindAll(params pagination.Params) ([]entity.User, pagination.Meta, error)
	FindByID(id string) (*entity.User, error)
	Update(id string, req dto.UpdateUserRequest) (*entity.User, error)
	Delete(id string) error
}
