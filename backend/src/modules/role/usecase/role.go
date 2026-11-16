package usecase

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type roleUsecase struct {
	repo repository.RoleRepository
}

func NewRoleUsecase(repo repository.RoleRepository) RoleUsecase {
	return &roleUsecase{repo: repo}
}

func (u *roleUsecase) FindAll(params pagination.Params) ([]entity.Role, pagination.Meta, error) {
	return u.repo.FindAll(params)
}

func (u *roleUsecase) FindByID(id string) (*entity.Role, error) {
	return u.repo.FindByID(id)
}

func (u *roleUsecase) Create(req dto.CreateRoleRequest) (*entity.Role, error) {
	role := &entity.Role{
		Name: req.Name,
	}

	if err := u.repo.Create(role); err != nil {
		return nil, err
	}

	return role, nil
}

func (u *roleUsecase) Update(id string, req dto.UpdateRoleRequest) (*entity.Role, error) {
	role, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		role.Name = *req.Name
	}

	if err := u.repo.Update(role); err != nil {
		return nil, err
	}

	return role, nil
}

func (u *roleUsecase) Delete(id string) error {
	role, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}

	return u.repo.Delete(role)
}
