package scheduleimport

import (
	"bytes"
	"strings"
	"testing"
	"time"

	"github.com/xuri/excelize/v2"
)

func workbook(t *testing.T, rows [][]any) *bytes.Reader {
	t.Helper()
	f := excelize.NewFile()
	_ = f.SetSheetName("Sheet1", sheetName)
	all := append([][]any{{"Date", "Time range", "Material (title)"}}, rows...)
	for i, r := range all {
		for j, v := range r {
			cell, _ := excelize.CoordinatesToCellName(j+1, i+1)
			_ = f.SetCellValue(sheetName, cell, v)
		}
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		t.Fatal(err)
	}
	return bytes.NewReader(buf.Bytes())
}

func TestTemplateRoundTrip(t *testing.T) {
	data, err := Template(time.Date(2026, 11, 16, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatal(err)
	}
	rows, errs, err := Parse(bytes.NewReader(data))
	if err != nil || len(errs) != 0 || len(rows) != 2 {
		t.Fatalf("template must parse cleanly: rows=%d errs=%v err=%v", len(rows), errs, err)
	}
	if got := rows[0].Date.Format("2006-01-02"); got != "2026-11-17" {
		t.Errorf("first example date = %s", got)
	}
	if rows[0].Start.Hour != 16 || rows[0].End.Minute != 30 {
		t.Errorf("time range wrong: %+v", rows[0])
	}
}

func TestParseValidAndInvalid(t *testing.T) {
	rows, errs, err := Parse(workbook(t, [][]any{
		{"2026-11-20", "16:00-17:30", "Algebra"},
		{"21/11/2026", "9.00 – 10.30", "Geometry"},
		{time.Date(2026, 11, 22, 0, 0, 0, 0, time.UTC), "08:00 to 09:00", "Real Excel date"},
		{"not a date", "16:00-17:00", "x"},
		{"2026-11-23", "17:00-16:00", "backwards"},
		{"2026-11-24", "16:00-17:00", ""},
		{"2026-11-20", "16:00-18:00", "duplicate slot"},
		{"", "", ""}, // blank row ignored
	}))
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 3 {
		t.Fatalf("want 3 valid rows, got %d: %+v", len(rows), rows)
	}
	if rows[1].Start.Hour != 9 || rows[1].End.Minute != 30 || rows[1].Date.Day() != 21 {
		t.Errorf("DD/MM/YYYY or dotted time wrong: %+v", rows[1])
	}
	if len(errs) != 4 {
		t.Fatalf("want 4 errors, got %d: %+v", len(errs), errs)
	}
	if errs[0].Line != 5 || !strings.Contains(errs[3].Message, "row 2") {
		t.Errorf("error rows/messages off: %+v", errs)
	}
}

func TestParseRejectsWrongFiles(t *testing.T) {
	if _, _, err := Parse(strings.NewReader("not an excel file")); err == nil {
		t.Error("garbage accepted")
	}
	f := excelize.NewFile()
	_ = f.SetCellValue("Sheet1", "A1", "Name")
	buf, _ := f.WriteToBuffer()
	if _, _, err := Parse(bytes.NewReader(buf.Bytes())); err == nil {
		t.Error("file without the template header accepted")
	}
	if _, _, err := Parse(workbook(t, nil)); err == nil {
		t.Error("empty schedule accepted")
	}
}
