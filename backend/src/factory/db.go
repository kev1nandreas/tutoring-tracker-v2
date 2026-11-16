package factory

import (
	"fmt"
	"log"
	"time"

	"github.com/kev1nandreas/go-rest-api-template/config"
	attachmentEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	attendanceEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/entity"
	bundleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/entity"
	feedbackEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/entity"
	jobEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/job/entity"
	meetingEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	paymentEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/payment/entity"
	pendingValidationEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/entity"
	roleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	submissionEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/submission/entity"
	tutorialEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewDatabase() *gorm.DB {
	isUseMigration := config.GetEnvBool("APP_MIGRATIONS", false)
	var database *gorm.DB
	var err error

	dbHostname := config.GetEnvString("POSTGRES_HOST", "localhost")
	dbName := config.GetEnvString("POSTGRES_DB", "postgres")
	dbUser := config.GetEnvString("POSTGRES_USER", "postgres")
	dbPass := config.GetEnvString("POSTGRES_PASSWORD", "password")
	dbPort := config.GetEnvString("POSTGRES_PORT", "5432")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=%s",
		dbHostname,
		dbUser,
		dbPass,
		dbName,
		dbPort,
		config.GetEnvString("APP_TIMEZONE", "Asia/Jakarta"),
	)

	for i := 1; i <= 3; i++ {
		database, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		} else {
			log.Printf("Attempt %d: Failed to initialize database. Retrying...", i)
			time.Sleep(3 * time.Second)
		}
	}

	if err != nil {
		log.Fatalf("Failed to connect to database after 3 attempts: %v", err)
	}

	if isUseMigration {
		if err := Migrate(database); err != nil {
			log.Fatalf("Failed to migrate database: %v", err)
		}
	}

	return database
}

func Migrate(db *gorm.DB) error {
	// Enable UUID extension for PostgreSQL
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return err
	}

	if err := dropOldFeedbackTable(db); err != nil {
		return err
	}

	if err := db.AutoMigrate(
		&roleEntity.Role{},
		&userEntity.User{},
		&tutorialEntity.Tutorial{},
		&tutorialEntity.TutorialStudent{},
		&meetingEntity.Meeting{},
		&attachmentEntity.Attachment{},
		&paymentEntity.Payment{},
		&pendingValidationEntity.PendingValidation{},
		&submissionEntity.Submission{},
		&jobEntity.Job{},
		&bundleEntity.Request{},
		&attendanceEntity.Attendance{},
		&feedbackEntity.Feedback{},
	); err != nil {
		return err
	}

	return ensureCascadeDeletes(db)
}

// dropOldFeedbackTable removes the first version of the feedbacks table (other questions,
// created and filled only while the form was being built) so AutoMigrate recreates it with
// the current columns. It only acts while the old column overall_rating still exists.
func dropOldFeedbackTable(db *gorm.DB) error {
	var old bool
	err := db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns
		WHERE table_schema = current_schema() AND table_name = 'feedbacks' AND column_name = 'overall_rating')`).Scan(&old).Error
	if err != nil || !old {
		return err
	}
	return db.Exec("DROP TABLE feedbacks").Error
}

// cascadeFK is a foreign key that must delete its rows together with the parent row.
type cascadeFK struct{ table, column, refTable string }

// cascadeFKs: deleting a tutorial removes its meetings and enrollments; deleting a
// meeting removes its attachments and submissions. Payments are deliberately NOT
// here: financial records must not vanish with a tutorial.
var cascadeFKs = []cascadeFK{
	{"meetings", "tutorial_id", "tutorials"},
	{"attachments", "meeting_id", "meetings"},
	{"submissions", "meeting_id", "meetings"},
	{"pending_validations", "tutorial_id", "tutorials"},
	{"tutorial_students", "tutorial_id", "tutorials"},
	{"bundle_requests", "tutorial_id", "tutorials"},
	{"attendances", "meeting_id", "meetings"},
	{"feedbacks", "tutorial_id", "tutorials"},
}

// ensureCascadeDeletes makes every cascadeFK exist with ON DELETE CASCADE. It is safe to
// run on every start: AutoMigrate never changes an existing constraint, and some links
// (enrollments) had no constraint at all. Rows left behind by tutorials deleted earlier
// (orphans) are removed, because the constraint cannot be added while they exist.
func ensureCascadeDeletes(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		for _, fk := range cascadeFKs {
			var existing []struct {
				Name       string
				DeleteRule string
			}
			err := tx.Raw(`
				SELECT con.conname AS name, con.confdeltype::text AS delete_rule
				FROM pg_constraint con
				JOIN pg_class rel ON rel.oid = con.conrelid
				JOIN pg_class ref ON ref.oid = con.confrelid
				JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
				WHERE con.contype = 'f' AND rel.relname = ? AND att.attname = ? AND ref.relname = ?`,
				fk.table, fk.column, fk.refTable).Scan(&existing).Error
			if err != nil {
				return err
			}

			add := fmt.Sprintf(`FOREIGN KEY (%s) REFERENCES %s(id) ON DELETE CASCADE`, fk.column, fk.refTable)

			if len(existing) == 0 {
				orphans := fmt.Sprintf(`DELETE FROM %s WHERE %s NOT IN (SELECT id FROM %s)`, fk.table, fk.column, fk.refTable)
				if err := tx.Exec(orphans).Error; err != nil {
					return err
				}
				name := fmt.Sprintf("fk_%s_%s", fk.table, fk.column)
				if err := tx.Exec(fmt.Sprintf(`ALTER TABLE %s ADD CONSTRAINT %s %s`, fk.table, name, add)).Error; err != nil {
					return err
				}
				continue
			}

			for _, c := range existing {
				if c.DeleteRule == "c" { // already cascades
					continue
				}
				stmt := fmt.Sprintf(`ALTER TABLE %s DROP CONSTRAINT %s, ADD CONSTRAINT %s %s`, fk.table, c.Name, c.Name, add)
				if err := tx.Exec(stmt).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
