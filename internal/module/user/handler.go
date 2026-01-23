package user

import (
	"encoding/json"
	"net/http"

	"twodo-server/internal/db"
	"twodo-server/internal/middleware/auth"
	"twodo-server/internal/module/user/models"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/response"

	"github.com/go-chi/chi/v5"
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

func (handler *Handler) Initialize(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	id, user := auth.GetUserID(request.Context(), handler.db)
	if id == nil {
		return http.StatusUnauthorized, response.NewError("error.unauthorized")
	}

	if user == nil {
		err := handler.service.InitializeUser(*id)
		switch err {
		case DatabaseError:
			return http.StatusInternalServerError, response.NewError("error.user_init_failed")

		case None:
			return http.StatusCreated, response.NewOK("success", nil)
		}
	}

	return http.StatusOK, response.NewOK("success", nil)
}

func (handler *Handler) CreateInvite(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	var body models.SendInviteRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	data, err := handler.service.CreateInvite(*user, body.User)
	switch err {
	case SelfInviteError:
		return http.StatusBadRequest, response.NewError("error.self_invite")
	case UserNotFoundError:
		return http.StatusNotFound, response.NewError("error.user_not_found")
	case None:
		return http.StatusCreated, response.NewOK("success", data)
	default:
		return http.StatusInternalServerError, response.NewError("error.invite_send_failed")
	}
}

func (handler *Handler) HandleInvite(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	var body models.HandleInviteRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	inviteID := chi.URLParam(request, "id")

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	switch handler.service.HandleInvite(body.Action, *user, inviteID) {
	case InviteNotFoundError:
		return http.StatusNotFound, response.NewError("error.invite_not_found")
	case NotInviteReceiverError:
		return http.StatusForbidden, response.NewError("error.not_invite_receiver")
	case CoupleFullError:
		return http.StatusConflict, response.NewError("error.couple_full")
	case UserNotFoundError:
		return http.StatusNotFound, response.NewError("error.user_not_found")
	case InvalidActionError:
		return http.StatusBadRequest, response.NewError("error.invalid_action")
	case None:
		return http.StatusOK, response.NewOK("success", nil)
	default:
		return http.StatusInternalServerError, response.NewError("error.invite_handle_failed")
	}
}

func (handler *Handler) DeleteInvite(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	inviteID := chi.URLParam(request, "id")

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	switch handler.service.DeleteInvite(*user, inviteID) {
	case InviteNotFoundError:
		return http.StatusNotFound, response.NewError("error.invite_not_found")
	case NotInviteSenderError:
		return http.StatusForbidden, response.NewError("error.not_invite_sender")
	case None:
		return http.StatusOK, response.NewOK("success", nil)
	default:
		return http.StatusInternalServerError, response.NewError("error.delete_invite_failed")
	}
}

func (handler *Handler) GetInvites(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	sent, received, err := handler.service.GetInvites(*user)
	if err != None {
		return http.StatusInternalServerError, response.NewError("error.list_invites_failed")
	}

	return http.StatusOK, response.NewOK("success", models.GetInvitesResponse{
		Sent:     sent,
		Received: received,
	})
}
