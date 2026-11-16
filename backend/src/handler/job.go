package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/job/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"gorm.io/gorm"
)

type JobHandler struct {
	usecase usecase.JobUsecase
}

func NewJobHandler(uc usecase.JobUsecase) *JobHandler {
	return &JobHandler{usecase: uc}
}

// FindJobs godoc
// @Summary List jobs with pagination
// @Description Paginated. Non-text columns (ids, flags, numbers, dates) can be used as exact filters, e.g. ?role_id=<uuid>
// @Tags job
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.Job
// @Router /jobs [get]
func (h *JobHandler) FindJobs(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindAll(params)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve jobs", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Jobs retrieved successfully", items, meta).Send(c)
}

// FindJob godoc
// @Summary Get a job by ID
// @Tags job
// @Produce json
// @Param id path string true "Job ID"
// @Success 200 {object} entity.Job
// @Failure 404 {string} string "Not found"
// @Router /jobs/{id} [get]
func (h *JobHandler) FindJob(c *gin.Context) {
	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Job retrieved successfully", item).Send(c)
}

func (h *JobHandler) notFoundOrError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NewErrorResponse(http.StatusNotFound, "Job not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process job", err.Error()).Send(c)
}
