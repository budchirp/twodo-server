package user

import (
	"context"
	"encoding/json"
	"net/http"

	"twodo-server/internal/db"
	"twodo-server/internal/db/models"
	"twodo-server/internal/middleware/auth"
	userModels "twodo-server/internal/module/user/models"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Handler struct {
	db db.DB
}

func NewHandler(db db.DB) Handler {
	return Handler{
		db: db,
	}
}

func (handler *Handler) Initialize(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	auth, user := auth.GetUser(request.Context(), handler.db)

	name := auth.Username
	if auth.Profile.Name != nil {
		name = *auth.Profile.Name
	}

	initializedUser := models.User{
		ID:       auth.ID,
		Username: auth.Username,
		Name:     name,
		Picture:  auth.Profile.Picture,
		CoupleID: nil,
	}

	if user != nil && user.CoupleID != nil {
		initializedUser.CoupleID = user.CoupleID
	}

	if err := handler.db.Adapter.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&initializedUser).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.user_init_failed")
	}

	if user != nil {
		*user = initializedUser
	}

	return http.StatusCreated, response.NewOK("success", nil)
}

func (handler *Handler) Get(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	return http.StatusOK, response.NewOK("success", userModels.NewUserResponse(*user))
}

func (handler *Handler) CreateInvite(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	var body userModels.SendInviteRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	receiver, err := gorm.G[models.User](handler.db.Adapter).Where("username = ?", body.Username).First(context.Background())
	if err != nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.ID == receiver.ID {
		return http.StatusBadRequest, response.NewError("error.self_invite")
	}

	invite := models.Invite{
		ID:         uuid.New().String(),
		SenderID:   user.ID,
		ReceiverID: receiver.ID,
		Status:     "pending",
	}

	if err := handler.db.Adapter.Create(&invite).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.invite_send_failed")
	}

	return http.StatusCreated, response.NewOK("success", invite)
}

type InviteAction string

const (
	InviteActionAccept InviteAction = "accept"
	InviteActionReject InviteAction = "reject"
)

func (handler *Handler) HandleInvite(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	var body userModels.HandleInviteRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	inviteID := chi.URLParam(request, "id")

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if body.Action != string(InviteActionAccept) && body.Action != string(InviteActionReject) {
		return http.StatusBadRequest, response.NewError("error.invalid_action")
	}

	invite, err := gorm.G[models.Invite](handler.db.Adapter).Where("id = ?", inviteID).First(context.Background())
	if err != nil {
		return http.StatusNotFound, response.NewError("error.invite_not_found")
	}

	receiver, err := gorm.G[models.User](handler.db.Adapter).Where("id = ?", invite.ReceiverID).First(context.Background())
	if err != nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.ID != receiver.ID {
		return http.StatusForbidden, response.NewError("error.not_invite_receiver")
	}

	if InviteAction(body.Action) == InviteActionReject {
		invite.Status = "rejected"
		if err := handler.db.Adapter.Save(&invite).Error; err != nil {
			return http.StatusInternalServerError, response.NewError("error.invite_handle_failed")
		}
		return http.StatusOK, response.NewOK("success", nil)
	}

	sender, err := gorm.G[models.User](handler.db.Adapter).Where("id = ?", invite.SenderID).First(context.Background())
	if err != nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if sender.CoupleID != nil {
		var count int64
		handler.db.Adapter.Model(&models.User{}).Where("couple_id = ?", sender.CoupleID).Count(&count)
		if count >= 2 {
			return http.StatusConflict, response.NewError("error.couple_full")
		}
	}

	if receiver.CoupleID != nil {
		var count int64
		handler.db.Adapter.Model(&models.User{}).Where("couple_id = ?", receiver.CoupleID).Count(&count)
		if count >= 2 {
			return http.StatusConflict, response.NewError("error.couple_full")
		}
	}

	couple := models.Couple{
		ID: uuid.New().String(),
	}
	if err := handler.db.Adapter.Create(&couple).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.invite_handle_failed")
	}

	sender.CoupleID = &couple.ID
	if err := handler.db.Adapter.Save(&sender).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.invite_handle_failed")
	}

	receiver.CoupleID = &couple.ID
	if err := handler.db.Adapter.Save(&receiver).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.invite_handle_failed")
	}

	invite.Status = "accepted"
	if err := handler.db.Adapter.Save(&invite).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.invite_handle_failed")
	}

	return http.StatusOK, response.NewOK("success", nil)
}

func (handler *Handler) GetInvites(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	sent, err := gorm.G[models.Invite](handler.db.Adapter).Preload("Sender", nil).Preload("Receiver", nil).Where("sender_id = ?", user.ID).Find(context.Background())
	if err != nil {
		return http.StatusInternalServerError, response.NewError("error.list_invites_failed")
	}

	received, err := gorm.G[models.Invite](handler.db.Adapter).Preload("Sender", nil).Preload("Receiver", nil).Where("receiver_id = ?", user.ID).Find(context.Background())
	if err != nil {
		return http.StatusInternalServerError, response.NewError("error.list_invites_failed")
	}

	return http.StatusOK, response.NewOK("success", userModels.NewInvitesResponse(sent, received))
}
