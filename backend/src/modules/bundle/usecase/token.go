package usecase

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/auth"
)

// A download link carries no login (a browser cannot send headers when it saves a
// file), so the link itself proves who asked: request id, user id and an expiry,
// signed with the server secret. It is short-lived and only works for that request.
const tokenTTL = 10 * time.Minute

var ErrBadToken = errors.New("this download link is not valid or has expired")

func sign(payload string) string {
	mac := hmac.New(sha256.New, auth.JwtKey)
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func issueToken(requestID, userID uuid.UUID, now time.Time) string {
	payload := requestID.String() + "|" + userID.String() + "|" + strconv.FormatInt(now.Add(tokenTTL).Unix(), 10)
	return base64.RawURLEncoding.EncodeToString([]byte(payload)) + "." + sign(payload)
}

func parseToken(token string, now time.Time) (requestID, userID uuid.UUID, err error) {
	enc, sig, ok := strings.Cut(token, ".")
	if !ok {
		return uuid.Nil, uuid.Nil, ErrBadToken
	}
	raw, derr := base64.RawURLEncoding.DecodeString(enc)
	if derr != nil {
		return uuid.Nil, uuid.Nil, ErrBadToken
	}
	payload := string(raw)
	if !hmac.Equal([]byte(sig), []byte(sign(payload))) {
		return uuid.Nil, uuid.Nil, ErrBadToken
	}

	parts := strings.Split(payload, "|")
	if len(parts) != 3 {
		return uuid.Nil, uuid.Nil, ErrBadToken
	}
	exp, perr := strconv.ParseInt(parts[2], 10, 64)
	rid, e1 := uuid.Parse(parts[0])
	uid, e2 := uuid.Parse(parts[1])
	if perr != nil || e1 != nil || e2 != nil || now.Unix() > exp {
		return uuid.Nil, uuid.Nil, ErrBadToken
	}
	return rid, uid, nil
}
