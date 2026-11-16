package dto

import (
	"fmt"
	"path/filepath"
	"strings"
)

// Attachment categories.
const (
	TypePPT     = "ppt"
	TypePicture = "picture"
	TypeBook    = "book"
	TypeVideo   = "video"
	TypeOther   = "other"
)

// Types lists the valid categories, in display order.
var Types = []string{TypePPT, TypePicture, TypeBook, TypeVideo, TypeOther}

const mb = 1 << 20

// MaxBytes is the largest file allowed per category.
var MaxBytes = map[string]int64{
	TypePPT:     100 * mb,
	TypePicture: 25 * mb,
	TypeBook:    200 * mb,
	TypeVideo:   1024 * mb,
	TypeOther:   100 * mb,
}

// contentTypes maps a file extension to the content type we store and serve, per
// category. The type always comes from here, never from the client.
var contentTypes = map[string]map[string]string{
	TypePPT: {
		".ppt":  "application/vnd.ms-powerpoint",
		".pps":  "application/vnd.ms-powerpoint",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
		".odp":  "application/vnd.oasis.opendocument.presentation",
		".key":  "application/vnd.apple.keynote",
		".pdf":  "application/pdf", // slides exported as PDF
	},
	TypePicture: {
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".webp": "image/webp",
		".bmp":  "image/bmp",
	},
	TypeBook: {
		".pdf":  "application/pdf",
		".epub": "application/epub+zip",
		".mobi": "application/x-mobipocket-ebook",
	},
	TypeVideo: {
		".mp4":  "video/mp4",
		".m4v":  "video/mp4",
		".webm": "video/webm",
		".mov":  "video/quicktime",
		".mkv":  "video/x-matroska",
	},
}

// blockedOther are extensions never accepted as "other": things a browser or OS would run.
var blockedOther = map[string]bool{
	".exe": true, ".msi": true, ".bat": true, ".cmd": true, ".com": true, ".scr": true,
	".sh": true, ".js": true, ".mjs": true, ".jar": true, ".php": true, ".html": true,
	".htm": true, ".svg": true, ".xhtml": true, ".dll": true, ".apk": true,
}

// ValidType reports whether t is one of the categories.
func ValidType(t string) bool {
	for _, v := range Types {
		if v == t {
			return true
		}
	}
	return false
}

// Ext returns the lower-case extension of a file name, with the dot.
func Ext(name string) string { return strings.ToLower(filepath.Ext(name)) }

// ContentTypeFor validates that fileName fits the category and returns the content
// type to store. "other" accepts any extension except the blocked ones.
func ContentTypeFor(attachmentType, fileName string) (string, error) {
	if !ValidType(attachmentType) {
		return "", fmt.Errorf("type must be one of: %s", strings.Join(Types, ", "))
	}
	ext := Ext(fileName)
	if attachmentType == TypeOther {
		if ext == "" || blockedOther[ext] {
			return "", fmt.Errorf("files of type %q are not allowed", ext)
		}
		return "application/octet-stream", nil
	}
	ct, ok := contentTypes[attachmentType][ext]
	if !ok {
		return "", fmt.Errorf("a %s file cannot be %q", attachmentType, ext)
	}
	return ct, nil
}

// CanOpenInline reports whether a stored content type is safe and useful to show in
// the browser (images, video, PDF). Everything else is served as a download.
func CanOpenInline(contentType string) bool {
	return strings.HasPrefix(contentType, "image/") ||
		strings.HasPrefix(contentType, "video/") ||
		contentType == "application/pdf"
}
