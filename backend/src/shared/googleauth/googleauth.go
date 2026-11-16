// Package googleauth verifies a Google ID token (the credential NextAuth gets after
// "Sign in with Google") by asking Google's tokeninfo endpoint.
package googleauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const tokenInfoURL = "https://oauth2.googleapis.com/tokeninfo"

// Profile is what we trust from a verified token.
type Profile struct {
	Email string
	Name  string
}

// Verifier checks ID tokens issued for one OAuth client.
type Verifier struct {
	clientID string
	endpoint string
	client   *http.Client
}

// New returns nil when clientID is empty (Google login disabled).
func New(clientID string) *Verifier {
	if clientID == "" {
		return nil
	}
	return &Verifier{
		clientID: clientID,
		endpoint: tokenInfoURL,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (v *Verifier) Enabled() bool { return v != nil }

type tokenInfo struct {
	Aud           string `json:"aud"`
	Iss           string `json:"iss"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Exp           string `json:"exp"`
}

// Verify returns the profile of a valid token for this client, or an error.
func (v *Verifier) Verify(ctx context.Context, idToken string) (*Profile, error) {
	if v == nil {
		return nil, errors.New("google login is not configured")
	}
	if idToken == "" {
		return nil, errors.New("missing id token")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.endpoint+"?id_token="+url.QueryEscape(idToken), nil)
	if err != nil {
		return nil, err
	}
	resp, err := v.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("google tokeninfo: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("invalid google token")
	}

	var info tokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("google tokeninfo: %w", err)
	}
	return v.check(info)
}

func (v *Verifier) check(info tokenInfo) (*Profile, error) {
	if info.Aud != v.clientID {
		return nil, errors.New("google token was issued for another app")
	}
	if info.Iss != "accounts.google.com" && info.Iss != "https://accounts.google.com" {
		return nil, errors.New("google token has a bad issuer")
	}
	if info.EmailVerified != "true" || info.Email == "" {
		return nil, errors.New("google email is not verified")
	}
	return &Profile{Email: strings.ToLower(info.Email), Name: info.Name}, nil
}
