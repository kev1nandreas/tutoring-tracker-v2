package repository

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var roleSortColumns = map[string]bool{
	"id":         true,
	"name":       true,
	"created_at": true,
	"updated_at": true,
}

type rolePostgresRepository struct {
	db *gorm.DB
}

func NewRolePostgresRepository(db *gorm.DB) RoleRepository {
	return &rolePostgresRepository{db: db}
}

func (r *rolePostgresRepository) FindAll(params pagination.Params) ([]entity.Role, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !roleSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.Role
	if _, meta, err := params.ApplyFiltered(r.db, &items, roleSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *rolePostgresRepository) FindByID(id string) (*entity.Role, error) {
	var role entity.Role
	if err := r.db.Where("id = ?", id).First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *rolePostgresRepository) Create(role *entity.Role) error {
	return r.db.Create(role).Error
}

func (r *rolePostgresRepository) Update(role *entity.Role) error {
	return r.db.Save(role).Error
}

func (r *rolePostgresRepository) Delete(role *entity.Role) error {
	return r.db.Delete(role).Error
}
