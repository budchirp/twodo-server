package couple

import (
	"net/http"

	"twodo-server/internal/db"
	"twodo-server/internal/db/models"
	"twodo-server/internal/middleware/auth"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/response"
)

type Handler struct {
	db db.DB
}

func NewHandler(db db.DB) Handler {
	return Handler{
		db: db,
	}
}

func (handler *Handler) Leave(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.CoupleID == nil {
		return http.StatusOK, response.NewOK("success", nil)
	}

	oldCoupleID := *user.CoupleID

	user.CoupleID = nil
	if err := handler.db.Adapter.Save(&user).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	}

	var count int64
	handler.db.Adapter.Model(&models.User{}).Where("couple_id = ?", oldCoupleID).Count(&count)
	if count == 0 {
		handler.db.Adapter.Delete(&models.Couple{}, "id = ?", oldCoupleID)
	}

	return http.StatusOK, response.NewOK("success", nil)
}