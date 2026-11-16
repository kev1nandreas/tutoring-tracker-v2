package dto

import (
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
)

// StudentMeeting is a meeting as a student sees it: no private notes, and the
// recording is only a YouTube video id, so the client can embed it but never
// receives (or opens) the raw link.
type StudentMeeting struct {
	ID           uuid.UUID `json:"id"`
	TutorialID   uuid.UUID `json:"tutorial_id"`
	Title        string    `json:"title"`
	Date         time.Time `json:"date"`
	TimeStart    time.Time `json:"time_start"`
	TimeEnd      time.Time `json:"time_end"`
	IsDone       bool      `json:"is_done"`
	HasHomework  bool      `json:"has_homework"`
	TextHomework string    `json:"text_homework"`
	// VideoID is the 11-character YouTube id, or empty when there is no valid recording.
	VideoID string `json:"video_id"`
}

func ToStudentMeeting(m entity.Meeting) StudentMeeting {
	return StudentMeeting{
		ID:           m.ID,
		TutorialID:   m.TutorialID,
		Title:        m.Title,
		Date:         m.Date,
		TimeStart:    m.TimeStart,
		TimeEnd:      m.TimeEnd,
		IsDone:       m.IsDone,
		HasHomework:  m.HasHomework,
		TextHomework: m.TextHomework,
		VideoID:      YouTubeID(m.YoutubeLink),
	}
}

var videoIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{11}$`)

// YouTubeID extracts the video id from a youtube.com or youtu.be link
// (watch?v=, /embed/, /shorts/, /live/, /v/, youtu.be/<id>). It returns "" for
// anything else, so a non-YouTube link can never end up in an embed.
func YouTubeID(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}

	host := strings.TrimPrefix(strings.ToLower(u.Hostname()), "www.")
	host = strings.TrimPrefix(host, "m.")

	var id string
	switch host {
	case "youtu.be":
		id = strings.TrimPrefix(u.Path, "/")
	case "youtube.com", "youtube-nocookie.com":
		if v := u.Query().Get("v"); v != "" {
			id = v
		} else {
			for _, prefix := range []string{"/embed/", "/shorts/", "/live/", "/v/"} {
				if strings.HasPrefix(u.Path, prefix) {
					id = strings.TrimPrefix(u.Path, prefix)
					break
				}
			}
		}
	default:
		return ""
	}

	// ignore trailing path segments such as /embed/<id>/extra
	if i := strings.Index(id, "/"); i >= 0 {
		id = id[:i]
	}
	if !videoIDPattern.MatchString(id) {
		return ""
	}
	return id
}
