package incomesync

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestUpsertAndDeleteSendKeyAndAcceptHeaders(t *testing.T) {
	var gotMethod, gotPath, gotKey, gotAccept string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotMethod, gotPath = r.Method, r.URL.Path
		gotKey, gotAccept = r.Header.Get("X-API-Key"), r.Header.Get("Accept")
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()

	s := New(srv.URL+"/", "secret")

	if err := s.Upsert(context.Background(), "abc", Income{Name: "n", Amount: 1, DueDate: time.Now()}); err != nil {
		t.Fatal(err)
	}
	if gotMethod != http.MethodPut || gotPath != "/api/v1/sync/incomes/abc" || gotKey != "secret" || gotAccept != "application/json" {
		t.Fatalf("unexpected upsert request: %s %s key=%q accept=%q", gotMethod, gotPath, gotKey, gotAccept)
	}

	if err := s.Delete(context.Background(), "abc"); err != nil {
		t.Fatal(err)
	}
	if gotMethod != http.MethodDelete || gotPath != "/api/v1/sync/incomes/abc" {
		t.Fatalf("unexpected delete request: %s %s", gotMethod, gotPath)
	}
}

func TestRejectedKeyIsAnError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	if err := New(srv.URL, "bad").Delete(context.Background(), "abc"); err == nil {
		t.Fatal("want error on 401")
	}
}

func TestNotConfiguredDoesNothing(t *testing.T) {
	if err := New("", "").Upsert(context.Background(), "abc", Income{}); err != nil {
		t.Fatal(err)
	}
}

func TestNormalizeBaseURL(t *testing.T) {
	for in, want := range map[string]string{
		"http://h:8080":        "http://h:8080",
		"http://h:8080/":       "http://h:8080",
		"http://h:8080/api":    "http://h:8080",
		"http://h:8080/api/":   "http://h:8080",
		"http://h:8080/api/v1": "http://h:8080",
	} {
		if got := normalizeBaseURL(in); got != want {
			t.Errorf("normalizeBaseURL(%q) = %q, want %q", in, got, want)
		}
	}
}
