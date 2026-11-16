package usecase

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"log"
	"path"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/repository"
)

// safeName turns free text into something safe as a file or folder name on any system:
// no path separators or reserved characters, no control characters, no leading/trailing
// dots or spaces, and a sane length.
func safeName(s string) string {
	s = strings.Map(func(r rune) rune {
		switch {
		case r < 0x20 || r == 0x7F:
			return -1
		case strings.ContainsRune(`/\:*?"<>|`, r):
			return '_'
		}
		return r
	}, s)
	// no ".." anywhere, so no tool can read a name as a parent directory
	for strings.Contains(s, "..") {
		s = strings.ReplaceAll(s, "..", ".")
	}
	s = strings.Trim(strings.TrimSpace(s), ".")
	if utf8.RuneCountInString(s) > 80 {
		s = string([]rune(s)[:80])
	}
	if s == "" {
		return "file"
	}
	return s
}

// uniqueName avoids two files with the same name in one folder: "a.pdf", "a (2).pdf".
func uniqueName(name string, used map[string]bool) string {
	if !used[strings.ToLower(name)] {
		used[strings.ToLower(name)] = true
		return name
	}
	ext := path.Ext(name)
	base := strings.TrimSuffix(name, ext)
	for i := 2; ; i++ {
		candidate := fmt.Sprintf("%s (%d)%s", base, i, ext)
		if !used[strings.ToLower(candidate)] {
			used[strings.ToLower(candidate)] = true
			return candidate
		}
	}
}

// writeZip streams the package into w as a zip: Summary.pdf, then one folder per
// meeting that has files. Every file is copied from storage to w as it is read, so
// memory stays small and no zip (or temporary file) is ever stored.
func (u *bundleUsecase) writeZip(ctx context.Context, w io.Writer, plan *repository.Plan, opt summaryOptions) error {
	zw := zip.NewWriter(w)

	// the summary is small text: compress it
	sum, err := zw.CreateHeader(&zip.FileHeader{Name: "Summary - " + safeName(plan.TutorialName) + ".pdf", Method: zip.Deflate, Modified: opt.Now})
	if err != nil {
		return err
	}
	if err := renderSummary(sum, plan, opt); err != nil {
		return err
	}

	for i, m := range plan.Meetings {
		if len(m.Files) == 0 {
			continue
		}
		folder := folderName(i+1, m.Title)
		for _, f := range m.Files {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			src, err := u.store.GetObject(ctx, f.Key)
			if err != nil {
				log.Printf("bundle: skipping %q (%s): %v", f.Name, f.Key, err)
				continue
			}

			// pictures, video, slides and books are already compressed: store them as they are
			entry, err := zw.CreateHeader(&zip.FileHeader{
				Name:     folder + "/" + f.ZipName,
				Method:   zip.Store,
				Modified: time.Now(),
			})
			if err != nil {
				_ = src.Close()
				return err
			}
			_, copyErr := io.Copy(entry, src)
			_ = src.Close()
			if copyErr != nil {
				// the entry is already half written, so the zip cannot be repaired: stop
				return fmt.Errorf("copy %q: %w", f.Name, copyErr)
			}
		}
	}
	return zw.Close()
}
