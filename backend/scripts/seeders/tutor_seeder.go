package seeders

import (
	"log"

	"github.com/kev1nandreas/go-rest-api-template/config"
	roleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedTutor creates the first tutor account (idempotent, matched by username).
// Public registration can only create students and only a tutor can create
// another tutor, so this account bootstraps the system.
// Override defaults with SEED_TUTOR_USERNAME / SEED_TUTOR_PASSWORD /
// SEED_TUTOR_NAME / SEED_TUTOR_EMAIL. Requires roles to be seeded first.
func SeedTutor(db *gorm.DB) error {
	username := config.GetEnvString("SEED_TUTOR_USERNAME", "tutor")
	password := config.GetEnvString("SEED_TUTOR_PASSWORD", "password123")

	var tutorRole roleEntity.Role
	if err := db.Where("name = ?", "tutor").First(&tutorRole).Error; err != nil {
		return err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := userEntity.User{
		RoleID:   tutorRole.ID,
		Name:     config.GetEnvString("SEED_TUTOR_NAME", "Default Tutor"),
		School:   "-",
		Phone:    "080000000000",
		Email:    config.GetEnvString("SEED_TUTOR_EMAIL", "tutor@example.com"),
		Username: username,
		Password: string(hashed),
	}

	if err := db.Where("username = ?", username).FirstOrCreate(&user).Error; err != nil {
		log.Printf("Failed to seed tutor %s: %v", username, err)
		return err
	}

	log.Printf("Successfully seeded tutor %q", username)
	return nil
}
