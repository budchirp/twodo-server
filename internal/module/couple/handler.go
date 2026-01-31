package couple

import (
	"context"
	"net/http"

	"twodo-server/internal/db"
	"twodo-server/internal/db/models"
	"twodo-server/internal/middleware/auth"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/response"

	"github.com/google/uuid"
	"gorm.io/gorm"
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

	newCouple := models.Couple{
		ID: uuid.New().String(),
	}

	if err := gorm.G[models.Couple](handler.db.Adapter).Create(context.Background(), &newCouple); err != nil {
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	}

	user.CoupleID = &newCouple.ID
	if err := handler.db.Adapter.Save(&user).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	}

	return http.StatusOK, response.NewOK("success", nil)
}