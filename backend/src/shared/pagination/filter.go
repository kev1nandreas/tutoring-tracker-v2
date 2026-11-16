package pagination

import (
	"strconv"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/schema"
)

// applyFilters narrows db using p.Filters. Only columns present in allowed are
// used, so column names are never taken from user input directly.
//   - text columns: not filterable (no keyword search)
//   - uuid / bool / numeric columns: exact match; a malformed value matches nothing
//   - other columns (date, time...): exact match
func (p *Params) applyFilters(db *gorm.DB, dest interface{}, allowed map[string]bool) *gorm.DB {
	if len(p.Filters) == 0 {
		return db
	}

	stmt := &gorm.Statement{DB: db}
	if err := stmt.Parse(dest); err != nil {
		return db
	}

	for key, value := range p.Filters {
		if !allowed[key] {
			continue
		}
		field := stmt.Schema.LookUpField(key)
		if field == nil {
			continue
		}
		col := clause.Column{Name: field.DBName}

		switch field.DataType {
		case schema.String:
			continue
		case "uuid":
			id, err := uuid.Parse(value)
			if err != nil {
				return db.Where("1 = 0")
			}
			db = db.Where(clause.Eq{Column: col, Value: id})
		case schema.Bool:
			b, err := strconv.ParseBool(value)
			if err != nil {
				return db.Where("1 = 0")
			}
			db = db.Where(clause.Eq{Column: col, Value: b})
		case schema.Int, schema.Uint, schema.Float:
			if _, err := strconv.ParseFloat(value, 64); err != nil {
				return db.Where("1 = 0")
			}
			db = db.Where(clause.Eq{Column: col, Value: value})
		default:
			db = db.Where(clause.Eq{Column: col, Value: value})
		}
	}

	return db
}

// ApplyFiltered is Apply plus column filtering (see applyFilters).
func (p *Params) ApplyFiltered(db *gorm.DB, dest interface{}, allowed map[string]bool) (interface{}, Meta, error) {
	base := p.applyFilters(db.Model(dest), dest, allowed)

	var totalItems int64
	if err := base.Session(&gorm.Session{}).Count(&totalItems).Error; err != nil {
		return nil, Meta{}, err
	}

	if err := base.Session(&gorm.Session{}).Order(p.GetOrderClause()).Limit(p.PageSize).Offset(p.GetOffset()).Find(dest).Error; err != nil {
		return nil, Meta{}, err
	}

	return dest, p.BuildMeta(totalItems), nil
}
