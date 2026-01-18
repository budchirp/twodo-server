package todo

import (
	"encoding/json"
	"net/http"

	"twodo-server/internal/db"
	"twodo-server/internal/middleware/auth"
	"twodo-server/internal/module/todo/models"
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

func (handler *Handler) CreateTodo(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	var body models.CreateTodoRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	data, err := handler.service.CreateTodo(*user, body.Title)
	switch err {
	case UserNoCoupleError:
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	case DatabaseError:
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	case None:
		return http.StatusCreated, response.NewOK("success", data)
	default:
		return http.StatusInternalServerError, response.NewError("error.unknown_error")
	}
}

func (handler *Handler) ListTodos(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	data, err := handler.service.ListTodos(*user)
	switch err {
	case UserNoCoupleError:
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	case DatabaseError:
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	case None:
		return http.StatusOK, response.NewOK("success", data)
	default:
		return http.StatusInternalServerError, response.NewError("error.unknown_error")
	}
}

func (handler *Handler) GetTodo(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	id := chi.URLParam(request, "id")

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	data, err := handler.service.GetTodo(*user, id)
	switch err {
	case UserNoCoupleError:
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	case TodoNotFoundError:
		return http.StatusNotFound, response.NewError("error.todo_not_found")
	case NotTodoOwnerError:
		return http.StatusForbidden, response.NewError("error.not_todo_owner")
	case None:
		return http.StatusOK, response.NewOK("success", data)
	default:
		return http.StatusInternalServerError, response.NewError("error.unknown_error")
	}
}

func (handler *Handler) UpdateTodo(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	id := chi.URLParam(request, "id")

	var body models.UpdateTodoRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	data, err := handler.service.UpdateTodo(*user, id, body.Title, body.Completed)
	switch err {
	case UserNoCoupleError:
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	case TodoNotFoundError:
		return http.StatusNotFound, response.NewError("error.todo_not_found")
	case NotTodoOwnerError:
		return http.StatusForbidden, response.NewError("error.not_todo_owner")
	case None:
		return http.StatusOK, response.NewOK("success", data)
	default:
		return http.StatusInternalServerError, response.NewError("error.unknown_error")
	}
}

func (handler *Handler) DeleteTodo(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	id := chi.URLParam(request, "id")

	_, user := auth.GetUserID(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	err := handler.service.DeleteTodo(*user, id)
	switch err {
	case UserNoCoupleError:
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	case TodoNotFoundError:
		return http.StatusNotFound, response.NewError("error.todo_not_found")
	case NotTodoOwnerError:
		return http.StatusForbidden, response.NewError("error.not_todo_owner")
	case None:
		return http.StatusOK, response.NewOK("success", nil)
	default:
		return http.StatusInternalServerError, response.NewError("error.unknown_error")
	}
}
