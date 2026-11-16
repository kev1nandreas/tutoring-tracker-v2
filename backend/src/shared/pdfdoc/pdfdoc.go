// Package pdfdoc writes simple PDF documents in pure Go: a title, headings,
// paragraphs, labelled lines and bullets. It embeds the Go fonts, so any Latin,
// Greek or Cyrillic text (names, schools) renders without system fonts.
package pdfdoc

import (
	"fmt"
	"io"
	"strings"

	"github.com/go-pdf/fpdf"
	"golang.org/x/image/font/gofont/gobold"
	"golang.org/x/image/font/gofont/goitalic"
	"golang.org/x/image/font/gofont/goregular"
)

const (
	family     = "gofont"
	marginMM   = 20.0
	bodySize   = 10.5
	lineHeight = 5.6
)

// Document builds pages in memory; WriteTo outputs the PDF.
type Document struct {
	pdf *fpdf.Fpdf
}

// New starts an A4 document. title is stored in the PDF metadata.
func New(title string) *Document {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(marginMM, marginMM, marginMM)
	pdf.SetAutoPageBreak(true, 18)
	pdf.SetTitle(clean(title), true)
	pdf.SetCreator("Tutoring Tracker", true)
	pdf.AddUTF8FontFromBytes(family, "", goregular.TTF)
	pdf.AddUTF8FontFromBytes(family, "B", gobold.TTF)
	pdf.AddUTF8FontFromBytes(family, "I", goitalic.TTF)

	pdf.AliasNbPages("{nb}")
	pdf.SetFooterFunc(func() {
		pdf.SetY(-12)
		pdf.SetFont(family, "", 8)
		pdf.SetTextColor(107, 114, 128)
		pdf.CellFormat(0, 5, fmt.Sprintf("Page %d of {nb}", pdf.PageNo()), "", 0, "C", false, 0, "")
	})
	pdf.AddPage()

	d := &Document{pdf: pdf}
	d.body()
	return d
}

// clean removes control characters (keeps newline and tab).
func clean(s string) string {
	return strings.Map(func(r rune) rune {
		if r == '\n' || r == '\t' || r >= 0x20 && r != 0x7F {
			return r
		}
		return -1
	}, strings.ReplaceAll(s, "\r", ""))
}

func (d *Document) body() {
	d.pdf.SetFont(family, "", bodySize)
	d.pdf.SetTextColor(31, 41, 55)
}

// Title is the large heading at the top.
func (d *Document) Title(text string) {
	d.pdf.SetFont(family, "B", 22)
	d.pdf.SetTextColor(30, 58, 138)
	d.pdf.MultiCell(0, 10, clean(text), "", "L", false)
	d.pdf.Ln(2)
	d.body()
}

// Heading level is 1 (section, with a rule) or 2 (sub-section).
func (d *Document) Heading(level int, text string) {
	// keep a heading with the text under it
	if d.pdf.GetY() > 255 {
		d.pdf.AddPage()
	}
	if level <= 1 {
		d.pdf.Ln(5)
		d.pdf.SetFont(family, "B", 15)
		d.pdf.SetTextColor(29, 78, 216)
		d.pdf.MultiCell(0, 8, clean(text), "", "L", false)
		y := d.pdf.GetY()
		d.pdf.SetDrawColor(216, 224, 240)
		d.pdf.Line(marginMM, y, 210-marginMM, y)
		d.pdf.Ln(3)
	} else {
		d.pdf.Ln(3)
		d.pdf.SetFont(family, "B", 12)
		d.pdf.SetTextColor(30, 58, 138)
		d.pdf.MultiCell(0, 6.5, clean(text), "", "L", false)
		d.pdf.Ln(1)
	}
	d.body()
}

// Paragraph is normal body text; "\n" starts a new line.
func (d *Document) Paragraph(text string) {
	d.body()
	d.pdf.MultiCell(0, lineHeight, clean(text), "", "L", false)
	d.pdf.Ln(1.5)
}

// Note is smaller grey italic text for hints and empty states.
func (d *Document) Note(text string) {
	d.pdf.SetFont(family, "I", 9.5)
	d.pdf.SetTextColor(107, 114, 128)
	d.pdf.MultiCell(0, lineHeight-0.4, clean(text), "", "L", false)
	d.pdf.Ln(1.5)
	d.body()
}

// Labeled writes "Label: value" with the label in bold.
func (d *Document) Labeled(label, value string) {
	d.pdf.SetFont(family, "B", bodySize)
	d.pdf.SetTextColor(31, 41, 55)
	d.pdf.Write(lineHeight, clean(label)+": ")
	d.body()
	d.pdf.Write(lineHeight, clean(value))
	d.pdf.Ln(lineHeight + 1.5)
}

// Bullet is a list item with a hanging indent.
func (d *Document) Bullet(text string) {
	d.body()
	const indent = 6.0
	x := d.pdf.GetX()
	d.pdf.SetX(x + 1)
	d.pdf.CellFormat(indent, lineHeight, "•", "", 0, "L", false, 0, "")
	d.pdf.MultiCell(0, lineHeight, clean(text), "", "L", false)
	d.pdf.SetX(x)
	d.pdf.Ln(0.5)
}

// Render writes the finished PDF to w.
func (d *Document) Render(w io.Writer) error {
	if err := d.pdf.Error(); err != nil {
		return err
	}
	return d.pdf.Output(w)
}
