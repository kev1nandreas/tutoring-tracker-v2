package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

// Healthcheck godoc
// @Summary Health check
// @Tags health
// @Produce json
// @Success 200 {string} ok
// @Router / [get]
func Healthcheck(c *gin.Context) {
	response.NewSuccessResponse("ok", nil).Send(c)
}
