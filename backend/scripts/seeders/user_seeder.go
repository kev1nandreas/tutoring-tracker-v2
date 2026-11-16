package seeders

import (
	"log"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedUsers requires roles to be seeded first.
func SeedUsers(db *gorm.DB, count int) error {
	gofakeit.Seed(0)

	var student entity.Role
	if err := db.Where("name = ?", "student").First(&student).Error; err != nil {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	for i := 0; i < count; i++ {
		user := userEntity.User{
			RoleID:   student.ID,
			Name:     gofakeit.Name(),
			School:   gofakeit.Company(),
			Phone:    gofakeit.Numerify("08##########"),
			Email:    gofakeit.Email(),
			Username: gofakeit.Username(),
			Password: string(hashedPassword),
		}

		if err := db.Create(&user).Error; err != nil {
			log.Printf("Failed to create user: %v", err)
			return err
		}
	}

	log.Printf("Successfully seeded %d users", count)
	return nil
}

func ClearUsers(db *gorm.DB) error {
	if err := db.Exec("DELETE FROM users").Error; err != nil {
		return err
	}
	log.Println("Successfully cleared users table")
	return nil
}
