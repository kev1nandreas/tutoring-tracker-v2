// Package scheduleimport reads a tutorial schedule from an Excel file (.xlsx) and
// builds the template tutors fill in. Columns: Date, Time range, Material (title).
package scheduleimport

import (
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/kev1nandreas/go-rest-api-template/src/shared/datetime"
	"github.com/xuri/excelize/v2"
)

const (
	sheetName = "Schedule"
	// MaxRows is the most schedule rows one file may hold.
	MaxRows = 200
	// MaxTitleLen is the meetings.title column size.
	MaxTitleLen = 100
)

// Row is one valid schedule line.
type Row struct {
	Line  int // spreadsheet row number, for messages
	Date  time.Time
	Start datetime.Clock
	End   datetime.Clock
	Title string
}

// RowError explains why one spreadsheet row was rejected.
type RowError struct {
	Line    int    `json:"row"`
	Message string `json:"message"`
}

// ErrBadFile is returned when the file is not a usable workbook or does not follow the template.
var ErrBadFile = errors.New("the file is not a valid schedule template")

var dateLayouts = []string{
	"2006-01-02", "02/01/2006", "2/1/2006", "02-01-2006", "2-1-2006", "02.01.2006",
	"2 Jan 2006", "02 Jan 2006", "2 January 2006", "02 January 2006", "Jan 2, 2006",
}

// range like "16:00-17:30", "16.00 – 17.30", "16:00 to 17:30"
var rangeRe = regexp.MustCompile(`^\s*(\d{1,2})[:.](\d{2})\s*(?:-|–|—|to|until|s/d)\s*(\d{1,2})[:.](\d{2})\s*$`)

// Parse reads the first sheet of an .xlsx file. Valid rows come back in file order;
// every problem row is listed in the errors (the caller decides whether to import anyway).
func Parse(r io.Reader) ([]Row, []RowError, error) {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return nil, nil, ErrBadFile
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, nil, ErrBadFile
	}
	sheet := sheets[0]
	if i, _ := f.GetSheetIndex(sheetName); i >= 0 {
		sheet = sheetName
	}

	// raw values: dates arrive as serial numbers, whatever format the cell shows
	grid, err := f.GetRows(sheet, excelize.Options{RawCellValue: true})
	if err != nil || len(grid) == 0 {
		return nil, nil, ErrBadFile
	}
	if err := checkHeader(grid[0]); err != nil {
		return nil, nil, err
	}

	var rows []Row
	var errs []RowError
	seen := map[string]int{}
	dataRows := 0

	for i, cells := range grid[1:] {
		line := i + 2
		if blank(cells) {
			continue
		}
		dataRows++
		if dataRows > MaxRows {
			return nil, nil, fmt.Errorf("too many rows: at most %d per file", MaxRows)
		}

		row, msg := parseRow(line, cells)
		if msg != "" {
			errs = append(errs, RowError{Line: line, Message: msg})
			continue
		}
		key := row.Date.Format("2006-01-02") + " " + fmt.Sprintf("%02d:%02d", row.Start.Hour, row.Start.Minute)
		if first, dup := seen[key]; dup {
			errs = append(errs, RowError{Line: line, Message: fmt.Sprintf("same date and start time as row %d", first)})
			continue
		}
		seen[key] = line
		rows = append(rows, row)
	}

	if dataRows == 0 {
		return nil, nil, errors.New("the file has no schedule rows")
	}
	return rows, errs, nil
}

func checkHeader(h []string) error {
	get := func(i int) string {
		if i < len(h) {
			return strings.ToLower(strings.TrimSpace(h[i]))
		}
		return ""
	}
	if !strings.Contains(get(0), "date") || !strings.Contains(get(1), "time") ||
		!(strings.Contains(get(2), "material") || strings.Contains(get(2), "title")) {
		return fmt.Errorf("%w: the first row must be Date, Time range, Material (title)", ErrBadFile)
	}
	return nil
}

func blank(cells []string) bool {
	for _, c := range cells {
		if strings.TrimSpace(c) != "" {
			return false
		}
	}
	return true
}

func parseRow(line int, cells []string) (Row, string) {
	at := func(i int) string {
		if i < len(cells) {
			return strings.TrimSpace(cells[i])
		}
		return ""
	}

	date, err := parseDate(at(0))
	if err != nil {
		return Row{}, err.Error()
	}
	start, end, err := parseRange(at(1))
	if err != nil {
		return Row{}, err.Error()
	}
	title := at(2)
	if title == "" {
		return Row{}, "material (title) is empty"
	}
	if len([]rune(title)) > MaxTitleLen {
		return Row{}, fmt.Sprintf("material (title) is longer than %d characters", MaxTitleLen)
	}
	return Row{Line: line, Date: date, Start: start, End: end, Title: title}, ""
}

func parseDate(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, errors.New("date is empty")
	}
	// a real Excel date: serial number of days
	if serial, err := strconv.ParseFloat(s, 64); err == nil {
		t, err := excelize.ExcelDateToTime(serial, false)
		if err != nil || serial < 1 {
			return time.Time{}, fmt.Errorf("date %q is not valid", s)
		}
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC), nil
	}
	for _, layout := range dateLayouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("date %q is not valid; use YYYY-MM-DD", s)
}

func parseRange(s string) (datetime.Clock, datetime.Clock, error) {
	if s == "" {
		return datetime.Clock{}, datetime.Clock{}, errors.New("time range is empty")
	}
	m := rangeRe.FindStringSubmatch(strings.ToLower(s))
	if m == nil {
		return datetime.Clock{}, datetime.Clock{}, fmt.Errorf("time range %q is not valid; use HH:MM-HH:MM, e.g. 16:00-17:30", s)
	}
	n := func(i int) int { v, _ := strconv.Atoi(m[i]); return v }
	start := datetime.Clock{Hour: n(1), Minute: n(2)}
	end := datetime.Clock{Hour: n(3), Minute: n(4)}
	for _, c := range []datetime.Clock{start, end} {
		if c.Hour > 23 || c.Minute > 59 {
			return start, end, fmt.Errorf("time range %q has an impossible time", s)
		}
	}
	if end.Minutes() <= start.Minutes() {
		return start, end, errors.New("end time must be after the start time")
	}
	return start, end, nil
}

// Template builds the .xlsx tutors download and fill in.
func Template(now time.Time) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	if err := f.SetSheetName("Sheet1", sheetName); err != nil {
		return nil, err
	}

	headers := []string{"Date", "Time range", "Material (title)"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		if err := f.SetCellValue(sheetName, cell, h); err != nil {
			return nil, err
		}
	}

	head, err := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"4F46E5"}, Pattern: 1},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})
	if err != nil {
		return nil, err
	}
	dateFmt := "yyyy-mm-dd"
	dateStyle, err := f.NewStyle(&excelize.Style{CustomNumFmt: &dateFmt})
	if err != nil {
		return nil, err
	}
	textStyle, err := f.NewStyle(&excelize.Style{NumFmt: 49}) // "@": keep "16:00-17:30" as written
	if err != nil {
		return nil, err
	}
	_ = f.SetCellStyle(sheetName, "A1", "C1", head)
	_ = f.SetCellStyle(sheetName, "A2", "A201", dateStyle)
	_ = f.SetCellStyle(sheetName, "B2", "B201", textStyle)
	_ = f.SetColWidth(sheetName, "A", "A", 16)
	_ = f.SetColWidth(sheetName, "B", "B", 18)
	_ = f.SetColWidth(sheetName, "C", "C", 48)
	_ = f.SetRowHeight(sheetName, 1, 24)
	_ = f.SetPanes(sheetName, &excelize.Panes{Freeze: true, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})

	// two example rows, a week apart, starting at the next day
	d1 := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)
	examples := []struct {
		date  time.Time
		rng   string
		title string
	}{
		{d1, "16:00-17:30", "Introduction"},
		{d1.AddDate(0, 0, 7), "16:00-17:30", "Chapter 1: Basics"},
	}
	for i, e := range examples {
		r := i + 2
		_ = f.SetCellValue(sheetName, fmt.Sprintf("A%d", r), e.date)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("B%d", r), e.rng)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("C%d", r), e.title)
	}

	const help = "Help"
	if _, err := f.NewSheet(help); err != nil {
		return nil, err
	}
	lines := []string{
		"How to fill in the schedule",
		"",
		"1. Use the Schedule sheet. Keep the first row (the headings) as it is.",
		"2. One meeting per row. Delete the two example rows before you import, or replace them.",
		"3. Date: a date such as 2026-11-20 (YYYY-MM-DD). A normal Excel date or DD/MM/YYYY also works.",
		"4. Time range: start and end, 24-hour, like 16:00-17:30. The end must be after the start.",
		fmt.Sprintf("5. Material (title): the meeting title, at most %d characters.", MaxTitleLen),
		fmt.Sprintf("6. At most %d rows per file. Empty rows are ignored.", MaxRows),
		"7. If any row has a problem, nothing is imported and you are told which rows to fix.",
		"8. A meeting that already exists at the same date and start time is reported, not duplicated.",
	}
	for i, l := range lines {
		_ = f.SetCellValue(help, fmt.Sprintf("A%d", i+1), l)
	}
	_ = f.SetColWidth(help, "A", "A", 100)
	bold, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Size: 13}})
	_ = f.SetCellStyle(help, "A1", "A1", bold)

	f.SetActiveSheet(0)
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
