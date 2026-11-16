package mailer

import (
	"net/mail"
	"strings"
	"testing"
)

func TestNewDisabledWithoutConfig(t *testing.T) {
	if New(Config{Host: "h"}) != nil {
		t.Fatal("expected nil mailer without password/from")
	}
	var m *Mailer
	if err := m.Send("a@b.co", "s", "b"); err != nil {
		t.Fatalf("nil mailer must no-op: %v", err)
	}
}

func TestBuildMessageStripsHeaderInjection(t *testing.T) {
	from, _ := mail.ParseAddress("App <app@x.co>")
	to, _ := mail.ParseAddress("u@x.co")
	msg := string(buildMessage(from, to, "Hi\r\nBcc: evil@x.co", "line1\nline2", ""))
	head := strings.SplitN(msg, "\r\n\r\n", 2)[0]
	if strings.Contains(head, "\r\nBcc:") {
		t.Fatalf("header injection: %q", head)
	}
	if !strings.Contains(msg, "line1\r\nline2") {
		t.Fatalf("body not CRLF: %q", msg)
	}
}

func TestBuildMessageMultipart(t *testing.T) {
	from, _ := mail.ParseAddress("App <app@x.co>")
	to, _ := mail.ParseAddress("u@x.co")
	msg := string(buildMessage(from, to, "Hi", "plain text", "<p>html</p>"))
	for _, want := range []string{"multipart/alternative", "text/plain", "text/html", "plain text", "<p>html</p>"} {
		if !strings.Contains(msg, want) {
			t.Errorf("missing %q in %q", want, msg)
		}
	}
	if strings.Index(msg, "text/plain") > strings.Index(msg, "text/html") {
		t.Error("plain text part must come before html")
	}
}

func TestEmailRenderEscapesAndHasButton(t *testing.T) {
	text, html := Email{
		AppName: "App", Title: "Reset", Greeting: "Hi <b>Bob</b>,",
		Paragraphs: []string{"p1"}, ButtonLabel: "Go", ButtonURL: "https://x.co/r?t=a&b=c",
	}.Render()
	if strings.Contains(html, "<b>Bob</b>") {
		t.Error("user text must be escaped in html")
	}
	if !strings.Contains(html, `href="https://x.co/r?t=a&amp;b=c"`) {
		t.Errorf("button link missing: %s", html)
	}
	if !strings.Contains(text, "https://x.co/r?t=a&b=c") {
		t.Errorf("text must have the raw link: %s", text)
	}
}
