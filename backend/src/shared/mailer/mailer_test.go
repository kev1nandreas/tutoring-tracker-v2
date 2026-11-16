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
	msg := string(buildMessage(from, to, "Hi\r\nBcc: evil@x.co", "line1\nline2"))
	head := strings.SplitN(msg, "\r\n\r\n", 2)[0]
	if strings.Contains(head, "\r\nBcc:") {
		t.Fatalf("header injection: %q", head)
	}
	if !strings.Contains(msg, "line1\r\nline2") {
		t.Fatalf("body not CRLF: %q", msg)
	}
}
