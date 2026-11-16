package usecase

import (
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pdfdoc"
)

// summaryOptions are the tutor's choices for what the summary PDF contains.
type summaryOptions struct {
	Recordings bool
	Homework   bool
	Now        time.Time
}

func humanBytes(n int64) string {
	const unit = 1024
	if n < unit {
		return fmt.Sprintf("%d B", n)
	}
	div, exp := int64(unit), 0
	for m := n / unit; m >= unit; m /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(n)/float64(div), "KMGT"[exp])
}

func longDate(iso string) string {
	t, err := time.Parse("2006-01-02", iso)
	if err != nil {
		return iso
	}
	return t.Format("Mon 2 Jan 2006")
}

// folderName is the zip folder of meeting number n (1-based): "01 - Title".
func folderName(n int, title string) string {
	return fmt.Sprintf("%02d - %s", n, safeName(title))
}

// renderSummary writes the PDF that opens the package: the class, then one block per meeting.
func renderSummary(w io.Writer, plan *repository.Plan, opt summaryOptions) error {
	doc := pdfdoc.New(plan.TutorialName)
	doc.Title(plan.TutorialName)

	doc.Labeled("Class code", plan.Code)
	if plan.TutorName != "" {
		doc.Labeled("Tutor", plan.TutorName)
	}
	doc.Labeled("Period", longDate(plan.DateStarted)+" to "+longDate(plan.DateEnded))
	who := plan.StudentName
	if plan.StudentSchool != "" {
		who += ", " + plan.StudentSchool
	}
	doc.Labeled("Prepared for", who)
	doc.Labeled("Created", opt.Now.Format("Mon 2 Jan 2006, 15:04"))
	if plan.Description != "" {
		doc.Paragraph(plan.Description)
	}

	done, files, bytes := 0, 0, int64(0)
	for _, m := range plan.Meetings {
		if m.IsDone {
			done++
		}
		for _, f := range m.Files {
			files++
			bytes += f.Size
		}
	}
	doc.Note(fmt.Sprintf("%d meetings (%d done), %d files (%s). Files are in folders named after each meeting, numbered like this summary.",
		len(plan.Meetings), done, files, humanBytes(bytes)))

	doc.Heading(1, "Meetings")
	if len(plan.Meetings) == 0 {
		doc.Note("There are no meetings in this class yet.")
	}

	for i, m := range plan.Meetings {
		n := i + 1
		doc.Heading(2, fmt.Sprintf("%d. %s", n, m.Title))
		when := longDate(m.Date)
		if m.TimeStart != "" && m.TimeEnd != "" {
			when += ", " + m.TimeStart + " to " + m.TimeEnd
		}
		doc.Labeled("When", when)
		status := "Not held yet"
		if m.IsDone {
			status = "Done"
		}
		doc.Labeled("Status", status)

		if opt.Homework && m.HasHomework {
			text := strings.TrimSpace(m.Homework)
			if text == "" {
				text = "Homework was assigned; no instructions were added."
			}
			doc.Labeled("Homework", text)
			switch s := m.Submission; {
			case s == nil:
				doc.Labeled("Your submission", "Not submitted")
			default:
				doc.Labeled("Your submission", "Submitted "+s.SubmittedAt.Format("2 Jan 2006"))
				if a := strings.TrimSpace(s.Answer); a != "" {
					doc.Labeled("Your answer", a)
				}
				if s.Grade != nil {
					doc.Labeled("Grade", fmt.Sprintf("%d/100", *s.Grade))
				} else {
					doc.Labeled("Grade", "Not graded yet")
				}
				if f := strings.TrimSpace(s.Feedback); f != "" {
					doc.Labeled("Feedback", f)
				}
			}
		}

		if opt.Recordings && strings.TrimSpace(m.YoutubeLink) != "" {
			doc.Labeled("Recording", strings.TrimSpace(m.YoutubeLink))
		}

		if len(m.Files) == 0 {
			doc.Note("No files for this meeting.")
			continue
		}
		doc.Paragraph(fmt.Sprintf("Files (%d), in the folder \"%s\":", len(m.Files), folderName(n, m.Title)))
		for _, f := range m.Files {
			doc.Bullet(fmt.Sprintf("%s (%s)", f.ZipName, humanBytes(f.Size)))
		}
	}

	return doc.Render(w)
}
