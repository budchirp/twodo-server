package response

import (
	"encoding/json"
	"net/http"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/slugify"
)

type ApiResponse struct {
	Error   bool   `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func NewOK(code string, data any) ApiResponse {
	i18n := i18n.Get()

	return ApiResponse{
		Error: false,

		Code:    slugify.Slugify(code),
		Message: i18n.T(code),
		Data:    data,
	}
}

func NewError(code string) ApiResponse {
	i18n := i18n.Get()

	return ApiResponse{
		Error: true,

		Code:    slugify.Slugify(code),
		Message: i18n.T(code),
	}
}

func (response ApiResponse) Send(writer http.ResponseWriter, status int) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	
	_ = json.NewEncoder(writer).Encode(response)
}
