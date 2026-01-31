package todo

import (
	"context"
	"encoding/json"
	"net/http"

	"twodo-server/internal/db"
	"twodo-server/internal/db/models"
	"twodo-server/internal/middleware/auth"
	todoModels "twodo-server/internal/module/todo/models"
	"twodo-server/internal/utils/i18n"
	"twodo-server/internal/utils/response"

	"github.com/go-chi/chi/v5"
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

func (handler *Handler) Create(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	var body todoModels.CreateTodoRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.CoupleID == nil {
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	}

	todo := models.Todo{
		ID:        uuid.New().String(),
		CoupleID:  *user.CoupleID,
		Title:     body.Title,
		Content:   "",
		Completed: false,
	}

	if err := handler.db.Adapter.Create(&todo).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	}

	return http.StatusCreated, response.NewOK("success", todoModels.NewTodoResponse(todo))
}

func (handler *Handler) GetAll(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.CoupleID == nil {
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	}

	var todos []models.Todo
	todos, err := gorm.G[models.Todo](handler.db.Adapter).Where("couple_id = ?", *user.CoupleID).Find(context.Background())
	if err != nil {
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	}

	return http.StatusOK, response.NewOK("success", todoModels.NewTodosResponse(todos))
}

func (handler *Handler) Get(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	id := chi.URLParam(request, "id")

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.CoupleID == nil {
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	}

	todo, err := gorm.G[models.Todo](handler.db.Adapter).Where("id = ?", id).First(context.Background())
	if err != nil {
		return http.StatusNotFound, response.NewError("error.todo_not_found")
	}

	if todo.CoupleID != *user.CoupleID {
		return http.StatusForbidden, response.NewError("error.not_todo_owner")
	}

	return http.StatusOK, response.NewOK("success", todoModels.NewTodoResponse(todo))
}

func (handler *Handler) Update(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	id := chi.URLParam(request, "id")

	var body todoModels.UpdateTodoRequest
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		return http.StatusBadRequest, response.NewError("error.invalid_request_body")
	}

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.CoupleID == nil {
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	}

	todo, err := gorm.G[models.Todo](handler.db.Adapter).Where("id = ?", id).First(context.Background())
	if err != nil {
		return http.StatusNotFound, response.NewError("error.todo_not_found")
	}

	if todo.CoupleID != *user.CoupleID {
		return http.StatusForbidden, response.NewError("error.not_todo_owner")
	}

	if body.Title != nil {
		todo.Title = *body.Title
	}

	if body.Content != nil {
		todo.Content = *body.Content
	}

	if body.Completed != nil {
		todo.Completed = *body.Completed
	}

	if err := handler.db.Adapter.Save(&todo).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	}

	return http.StatusOK, response.NewOK("success", todoModels.NewTodoResponse(todo))
}

func (handler *Handler) Delete(request *http.Request) (int, response.ApiResponse) {
	_ = i18n.Load(request)

	id := chi.URLParam(request, "id")

	_, user := auth.GetUser(request.Context(), handler.db)
	if user == nil {
		return http.StatusNotFound, response.NewError("error.user_not_found")
	}

	if user.CoupleID == nil {
		return http.StatusForbidden, response.NewError("error.user_no_couple")
	}

	todo, err := gorm.G[models.Todo](handler.db.Adapter).Where("id = ?", id).First(context.Background())
	if err != nil {
		return http.StatusNotFound, response.NewError("error.todo_not_found")
	}

	if todo.CoupleID != *user.CoupleID {
		return http.StatusForbidden, response.NewError("error.not_todo_owner")
	}

	if err := handler.db.Adapter.Delete(&todo).Error; err != nil {
		return http.StatusInternalServerError, response.NewError("error.internal_server_error")
	}

	return http.StatusOK, response.NewOK("success", nil)
}
