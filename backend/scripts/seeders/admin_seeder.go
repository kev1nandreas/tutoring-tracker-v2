package seeders

import (
	"log"

	"github.com/kev1nandreas/go-rest-api-template/config"
	roleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedAdmin creates the admin account (idempotent, matched by username). Only an admin
// sees the Users page, where tutors are added and users deleted, so this bootstraps it.
// Override defaults with SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME /
// SEED_ADMIN_EMAIL. Requires roles to be seeded first.
func SeedAdmin(db *gorm.DB) error {
	username := config.GetEnvString("SEED_ADMIN_USERNAME", "admin")
	password := config.GetEnvString("SEED_ADMIN_PASSWORD", "password123")

	var adminRole roleEntity.Role
	if err := db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		return err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := userEntity.User{
		RoleID:   adminRole.ID,
		Name:     config.GetEnvString("SEED_ADMIN_NAME", "Admin"),
		School:   "-",
		Phone:    "080000000000",
		Email:    config.GetEnvString("SEED_ADMIN_EMAIL", "admin@example.com"),
		Username: username,
		Password: string(hashed),
	}

	if err := db.Where("username = ?", username).FirstOrCreate(&user).Error; err != nil {
		log.Printf("Failed to seed admin %s: %v", username, err)
		return err
	}

	log.Printf("Successfully seeded admin %q", username)
	return nil
}
