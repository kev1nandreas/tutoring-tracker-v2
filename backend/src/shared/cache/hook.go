package cache

import (
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
)

// tableNamespaces says which cached read models depend on which table. A successful
// write to a table invalidates its namespaces, wherever in the code the write happens.
var tableNamespaces = map[string][]string{
	"users":               {NSStudents},
	"tutorials":           {NSDashboard, NSStudents, NSTutorials},
	"tutorial_students":   {NSDashboard, NSStudents, NSTutorials},
	"pending_validations": {NSDashboard, NSStudents, NSTutorials},
	"meetings":            {NSDashboard, NSStudents, NSTutorials},
	"attachments":         {NSDashboard, NSTutorials},
	"payments":            {NSDashboard},
	"submissions":         {NSDashboard, NSStudents},
	"attendances":         {NSStudents, NSTutorials},
}

// settleDelay: writes inside a transaction fire the hook before COMMIT, so a reader could
// re-cache the old data between the first invalidation and the commit. Invalidating once
// more after this delay removes that window.
const settleDelay = 2 * time.Second

var rawWrite = regexp.MustCompile(`(?is)^\s*(?:insert\s+into|update|delete\s+from)\s+(?:only\s+)?"?(?:[a-z_]+"?\.\s*"?)?([a-z_]+)`)

// RegisterInvalidation hooks GORM so any create, update, delete or raw INSERT/UPDATE/DELETE
// on a watched table invalidates the dependent caches. Call it once, right after opening
// the database.
func RegisterInvalidation(db *gorm.DB, c *Cache) error {
	if c == nil {
		return nil
	}
	fire := func(table string) {
		ns, ok := tableNamespaces[table]
		if !ok {
			return
		}
		c.Invalidate(ns...)
		time.AfterFunc(settleDelay, func() { c.Invalidate(ns...) })
	}
	byTable := func(tx *gorm.DB) {
		if tx.Error == nil && tx.Statement != nil {
			fire(tx.Statement.Table)
		}
	}
	byRaw := func(tx *gorm.DB) {
		if tx.Error != nil || tx.Statement == nil {
			return
		}
		if m := rawWrite.FindStringSubmatch(tx.Statement.SQL.String()); m != nil {
			fire(strings.ToLower(m[1]))
		}
	}

	if err := db.Callback().Create().After("gorm:create").Register("cache:invalidate_create", byTable); err != nil {
		return err
	}
	if err := db.Callback().Update().After("gorm:update").Register("cache:invalidate_update", byTable); err != nil {
		return err
	}
	if err := db.Callback().Delete().After("gorm:delete").Register("cache:invalidate_delete", byTable); err != nil {
		return err
	}
	return db.Callback().Raw().After("gorm:raw").Register("cache:invalidate_raw", byRaw)
}
