package couple

import (
	"net/http"

	"twodo-server/internal/db"
	"twodo-server/internal/middleware/auth"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/response"
)

type Handler struct {
	service Service
	db      db.DB
}

func NewHandler(db db.DB) Handler {
	return Handler{
		service: NewService(db),
		db:      db,
	}
}

func (handler *Handler) LeaveCouple(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	switch handler.service.LeaveCouple(*user) {
	case DatabaseError:
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	case None:
		return http.StatusOK, response.NewOK("success", nil)
	default:
		return http.StatusInternalServerError, response.NewError("error.leave_couple_failed")
	}
}
