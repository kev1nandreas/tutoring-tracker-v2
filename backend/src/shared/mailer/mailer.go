// Package mailer sends plain-text email through an SMTP server (e.g. Mailtrap).
// Port 465 uses implicit TLS; any other port uses STARTTLS.
package mailer

import (
	"crypto/tls"
	"fmt"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
)

const dialTimeout = 10 * time.Second

// Config is the SMTP connection setup. An empty Host disables sending.
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string // address, or "Name <address>"
	FromName string
}

// Mailer sends email. A nil *Mailer is safe to use and sends nothing.
type Mailer struct {
	cfg Config
}

// New returns nil when SMTP is not configured (host, password or from missing).
func New(cfg Config) *Mailer {
	if cfg.Host == "" || cfg.Password == "" || cfg.From == "" {
		return nil
	}
	if cfg.Port == 0 {
		cfg.Port = 587
	}
	return &Mailer{cfg: cfg}
}

// Enabled reports whether Send will actually deliver.
func (m *Mailer) Enabled() bool { return m != nil }

// Send delivers one plain-text message to one recipient.
func (m *Mailer) Send(to, subject, body string) error {
	if m == nil {
		return nil
	}
	rcpt, err := mail.ParseAddress(to)
	if err != nil {
		return fmt.Errorf("mailer: bad recipient %q: %w", to, err)
	}
	from, err := mail.ParseAddress(m.cfg.From)
	if err != nil {
		return fmt.Errorf("mailer: bad sender %q: %w", m.cfg.From, err)
	}
	if m.cfg.FromName != "" && from.Name == "" {
		from.Name = m.cfg.FromName
	}

	msg := buildMessage(from, rcpt, subject, body)
	return m.deliver(from.Address, rcpt.Address, msg)
}

func (m *Mailer) deliver(from, to string, msg []byte) error {
	addr := net.JoinHostPort(m.cfg.Host, fmt.Sprint(m.cfg.Port))
	tlsCfg := &tls.Config{ServerName: m.cfg.Host, MinVersion: tls.VersionTLS12}

	conn, err := net.DialTimeout("tcp", addr, dialTimeout)
	if err != nil {
		return fmt.Errorf("mailer: dial %s: %w", addr, err)
	}
	_ = conn.SetDeadline(time.Now().Add(30 * time.Second))

	if m.cfg.Port == 465 {
		conn = tls.Client(conn, tlsCfg)
	}

	c, err := smtp.NewClient(conn, m.cfg.Host)
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("mailer: smtp handshake: %w", err)
	}
	defer c.Close()

	if m.cfg.Port != 465 {
		// TLS is required: never send credentials in the clear.
		if err := c.StartTLS(tlsCfg); err != nil {
			return fmt.Errorf("mailer: starttls: %w", err)
		}
	}
	if m.cfg.Username != "" {
		if err := c.Auth(smtp.PlainAuth("", m.cfg.Username, m.cfg.Password, m.cfg.Host)); err != nil {
			return fmt.Errorf("mailer: auth: %w", err)
		}
	}
	if err := c.Mail(from); err != nil {
		return fmt.Errorf("mailer: MAIL FROM: %w", err)
	}
	if err := c.Rcpt(to); err != nil {
		return fmt.Errorf("mailer: RCPT TO: %w", err)
	}
	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("mailer: DATA: %w", err)
	}
	if _, err := w.Write(msg); err != nil {
		return fmt.Errorf("mailer: write: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("mailer: end data: %w", err)
	}
	return c.Quit()
}

// buildMessage makes an RFC 5322 message; header values have CR/LF stripped to
// prevent header injection.
func buildMessage(from, to *mail.Address, subject, body string) []byte {
	var b strings.Builder
	b.WriteString("From: " + from.String() + "\r\n")
	b.WriteString("To: " + to.String() + "\r\n")
	b.WriteString("Subject: " + mimeHeader(subject) + "\r\n")
	b.WriteString("Date: " + time.Now().Format(time.RFC1123Z) + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	b.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
	b.WriteString(strings.ReplaceAll(strings.ReplaceAll(body, "\r\n", "\n"), "\n", "\r\n"))
	b.WriteString("\r\n")
	return []byte(b.String())
}

func mimeHeader(s string) string {
	s = strings.NewReplacer("\r", " ", "\n", " ").Replace(s)
	return mime.QEncoding.Encode("utf-8", s)
}
