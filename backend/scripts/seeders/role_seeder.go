package seeders

import (
	"log"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"gorm.io/gorm"
)

var defaultRoles = []string{"admin", "tutor", "student"}

func SeedRoles(db *gorm.DB) error {
	for _, name := range defaultRoles {
		role := entity.Role{Name: name}
		if err := db.Where("name = ?", name).FirstOrCreate(&role).Error; err != nil {
			log.Printf("Failed to seed role %s: %v", name, err)
			return err
		}
	}

	log.Printf("Successfully seeded %d roles", len(defaultRoles))
	return nil
}

func ClearRoles(db *gorm.DB) error {
	if err := db.Exec("DELETE FROM roles").Error; err != nil {
		return err
	}
	log.Println("Successfully cleared roles table")
	return nil
}
