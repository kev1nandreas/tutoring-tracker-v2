// Package incomesync keeps the personal website's income list in step with
// tutoring payments, by calling its API with an API key.
package incomesync

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Income is one income entry as the personal website stores it.
type Income struct {
	Name        string    `json:"name"`
	Source      string    `json:"source"`
	Amount      int       `json:"amount"`
	DueDate     time.Time `json:"due_date"`
	PaymentDate time.Time `json:"payment_date"`
	// Status is "pending" or "received".
	Status string `json:"status"`
	Note   string `json:"note"`
}

// Syncer pushes and removes incomes by the id of the record they came from.
type Syncer interface {
	Upsert(ctx context.Context, externalID string, income Income) error
	Delete(ctx context.Context, externalID string) error
}

type client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

// New returns a Syncer for the personal website API. When baseURL or apiKey is
// empty the sync is switched off and every call does nothing.
func New(baseURL, apiKey string) Syncer {
	baseURL = normalizeBaseURL(baseURL)
	if baseURL == "" || apiKey == "" {
		log.Println("incomesync: PERSONAL_WEBSITE_URL or PERSONAL_WEBSITE_API_KEY not set, income sync is off")
		return noop{}
	}
	return &client{baseURL: baseURL, apiKey: apiKey, http: &http.Client{Timeout: 10 * time.Second}}
}

// normalizeBaseURL keeps the host only: the client adds /api/v1/... itself, so a URL
// pasted with a trailing /api or /api/v1 would otherwise call /api/api/v1/... (404).
func normalizeBaseURL(raw string) string {
	u := strings.TrimRight(strings.TrimSpace(raw), "/")
	for _, suffix := range []string{"/api/v1", "/api"} {
		if strings.HasSuffix(u, suffix) {
			return strings.TrimRight(strings.TrimSuffix(u, suffix), "/")
		}
	}
	return u
}

func (c *client) Upsert(ctx context.Context, externalID string, income Income) error {
	body, err := json.Marshal(income)
	if err != nil {
		return err
	}
	return c.do(ctx, http.MethodPut, externalID, bytes.NewReader(body))
}

func (c *client) Delete(ctx context.Context, externalID string) error {
	return c.do(ctx, http.MethodDelete, externalID, nil)
}

func (c *client) do(ctx context.Context, method, externalID string, body io.Reader) error {
	endpoint := fmt.Sprintf("%s/api/v1/sync/incomes/%s", c.baseURL, url.PathEscape(externalID))
	req, err := http.NewRequestWithContext(ctx, method, endpoint, body)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	msg, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
	return fmt.Errorf("personal website answered %d: %s", resp.StatusCode, strings.TrimSpace(string(msg)))
}

type noop struct{}

func (noop) Upsert(context.Context, string, Income) error { return nil }
func (noop) Delete(context.Context, string) error         { return nil }
