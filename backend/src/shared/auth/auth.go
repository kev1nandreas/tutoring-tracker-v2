package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"golang.org/x/crypto/bcrypt"
)

// Claims struct to be encoded to JWT
type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	jwt.StandardClaims
}

var JwtKey = []byte(config.GetEnvString("JWT_SECRET_KEY", GenerateRandomKey()))

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func GenerateToken(userID, username, email, role string) (string, error) {
	expirationTime := time.Now().Add(12 * time.Hour).Unix()

	claims := &Claims{
		UserID:   userID,
		Username: username,
		Email:    email,
		Role:     role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime,
			Issuer:    username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(JwtKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func GenerateRandomKey() string {
	key := make([]byte, 32)
	_, err := rand.Read(key)
	if err != nil {
		panic("Failed to generate random key: " + err.Error())
	}

	return base64.StdEncoding.EncodeToString(key)
}

// ResetTokenTTL is how long a password reset link works.
const ResetTokenTTL = 30 * time.Minute

type resetClaims struct {
	UserID string `json:"user_id"`
	// Fingerprint of the current password hash: once the password changes the
	// token stops matching, so a reset link works only once.
	Fingerprint string `json:"pwf"`
	jwt.StandardClaims
}

// resetKey differs from JwtKey so a reset token can never pass as a login token.
func resetKey() []byte { return append(append([]byte{}, JwtKey...), []byte("|password-reset")...) }

func passwordFingerprint(passwordHash string) string {
	sum := sha256.Sum256([]byte(passwordHash))
	return hex.EncodeToString(sum[:8])
}

// GenerateResetToken makes a short-lived, single-use token to reset one user's password.
func GenerateResetToken(userID, passwordHash string) (string, error) {
	claims := &resetClaims{
		UserID:      userID,
		Fingerprint: passwordFingerprint(passwordHash),
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(ResetTokenTTL).Unix(),
			Subject:   "password-reset",
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(resetKey())
}

// ParseResetToken returns the user id and password fingerprint from a valid reset token.
func ParseResetToken(token string) (userID, fingerprint string, err error) {
	claims := &resetClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return resetKey(), nil
	})
	if err != nil || !parsed.Valid || claims.Subject != "password-reset" || claims.UserID == "" {
		return "", "", errors.New("reset link is invalid or has expired")
	}
	return claims.UserID, claims.Fingerprint, nil
}

// MatchesPassword reports whether a reset token's fingerprint belongs to this password hash.
func MatchesPassword(fingerprint, passwordHash string) bool {
	return subtle.ConstantTimeCompare([]byte(fingerprint), []byte(passwordFingerprint(passwordHash))) == 1
}
