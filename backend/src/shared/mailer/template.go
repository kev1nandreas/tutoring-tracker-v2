package mailer

import (
	"bytes"
	"fmt"
	htmltemplate "html/template"
	"strings"
)

// Email describes a simple transactional email: a title, some paragraphs and one button.
type Email struct {
	AppName    string
	Title      string
	Greeting   string
	Paragraphs []string
	// ButtonLabel and ButtonURL are optional; the link is also printed under the button.
	ButtonLabel string
	ButtonURL   string
	// Footnote is small grey text at the bottom, e.g. "If you did not ask for this, ignore it."
	Footnote string
}

// Render returns the plain-text and HTML versions of the email.
func (e Email) Render() (text, html string) {
	return e.text(), e.html()
}

func (e Email) text() string {
	var b strings.Builder
	if e.Greeting != "" {
		b.WriteString(e.Greeting + "\n\n")
	}
	for _, p := range e.Paragraphs {
		b.WriteString(p + "\n\n")
	}
	if e.ButtonURL != "" {
		fmt.Fprintf(&b, "%s:\n%s\n\n", e.ButtonLabel, e.ButtonURL)
	}
	if e.Footnote != "" {
		b.WriteString(e.Footnote + "\n")
	}
	return b.String()
}

func (e Email) html() string {
	var buf bytes.Buffer
	if err := emailTmpl.Execute(&buf, e); err != nil {
		return "" // caller falls back to plain text
	}
	return buf.String()
}

// Table layout and inline styles: the only thing every mail client renders the same.
var emailTmpl = htmltemplate.Must(htmltemplate.New("email").Parse(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{.Title}}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
<tr><td style="padding:28px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#4f46e5;">{{.AppName}}</td></tr>
<tr><td style="padding:16px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#111827;">{{.Title}}</td></tr>
<tr><td style="padding:16px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#374151;">
{{if .Greeting}}<p style="margin:0 0 14px 0;">{{.Greeting}}</p>{{end}}
{{range .Paragraphs}}<p style="margin:0 0 14px 0;">{{.}}</p>{{end}}
</td></tr>
{{if .ButtonURL}}
<tr><td align="center" style="padding:12px 32px 8px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td align="center" bgcolor="#4f46e5" style="border-radius:8px;">
<a href="{{.ButtonURL}}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">{{.ButtonLabel}}</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:8px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
Button not working? Copy this link into your browser:<br>
<a href="{{.ButtonURL}}" style="color:#4f46e5;word-break:break-all;">{{.ButtonURL}}</a>
</td></tr>
{{end}}
<tr><td style="padding:24px 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;border-top:0;">
{{if .Footnote}}{{.Footnote}}<br><br>{{end}}&copy; {{.AppName}}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`))
