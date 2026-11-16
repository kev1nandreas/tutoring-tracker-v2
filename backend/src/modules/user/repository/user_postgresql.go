package repository

import (
	roleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var userSortColumns = map[string]bool{
	"id": true, "role_id": true, "name": true, "school": true, "phone": true,
	"email": true, "username": true, "created_at": true, "updated_at": true,
}

type userPostgresRepository struct {
	db *gorm.DB
}

func NewUserPostgresRepository(db *gorm.DB) UserRepository {
	return &userPostgresRepository{db: db}
}

func (r *userPostgresRepository) FindAll(params pagination.Params) ([]entity.User, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !userSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.User
	if _, meta, err := params.ApplyFiltered(r.db, &items, userSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *userPostgresRepository) FindByID(id string) (*entity.User, error) {
	var user entity.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userPostgresRepository) FindByUsername(username string) (*entity.User, error) {
	var user entity.User
	if err := r.db.Preload("Role").Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userPostgresRepository) FindRoleByName(name string) (*roleEntity.Role, error) {
	var role roleEntity.Role
	if err := r.db.Where("name = ?", name).First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *userPostgresRepository) Create(user *entity.User) error {
	return r.db.Create(user).Error
}

func (r *userPostgresRepository) Update(user *entity.User) error {
	return r.db.Save(user).Error
}

func (r *userPostgresRepository) Delete(user *entity.User) error {
	return r.db.Delete(user).Error
}
