package server

import (
	"net/http"

	"twodo-server/internal/module/server/models"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/response"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) Handler {
	return Handler{
		service: service,
	}
}

func (handler *Handler) GetVersion(
	request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	return http.StatusOK, response.NewOK("success", &models.GetVersionResponse{
		Version: handler.service.GetVersion(),
	})
}
