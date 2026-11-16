package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type DashboardHandler struct {
	usecase usecase.DashboardUsecase
}

func NewDashboardHandler(uc usecase.DashboardUsecase) *DashboardHandler {
	return &DashboardHandler{usecase: uc}
}

// TutorDashboard godoc
// @Summary Tutor dashboard
// @Description Upcoming meetings, active tutorials, income this month/year and meetings still missing an attachment. Tutor sees own tutorials; admin sees all.
// @Tags dashboard
// @Security JwtAuth
// @Produce json
// @Success 200 {object} dto.TutorDashboard
// @Failure 403 {string} string "Forbidden"
// @Router /dashboard/tutor [get]
func (h *DashboardHandler) TutorDashboard(c *gin.Context) {
	role := c.GetString("role")
	if role != "tutor" && role != "admin" {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", "tutor access only").Send(c)
		return
	}

	data, err := h.usecase.Tutor(c.GetString("user_id"), role == "admin")
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to load dashboard", err.Error()).Send(c)
		return
	}

	response.NewSuccessResponse("Dashboard retrieved successfully", data).Send(c)
}

// StudentDashboard godoc
// @Summary Student dashboard
// @Description Pending homework, upcoming tutorials and enrolled active tutorials.
// @Tags dashboard
// @Security JwtAuth
// @Produce json
// @Success 200 {object} dto.StudentDashboard
// @Failure 403 {string} string "Forbidden"
// @Router /dashboard/student [get]
func (h *DashboardHandler) StudentDashboard(c *gin.Context) {
	if c.GetString("role") != "student" {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", "student access only").Send(c)
		return
	}

	data, err := h.usecase.Student(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to load dashboard", err.Error()).Send(c)
		return
	}

	response.NewSuccessResponse("Dashboard retrieved successfully", data).Send(c)
}
