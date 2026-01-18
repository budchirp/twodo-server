package todo

import (
	"context"
	"twodo-server/internal/db"
	"twodo-server/internal/db/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Error int

const (
	DatabaseError Error = iota
	UserNoCoupleError
	TodoNotFoundError
	NotTodoOwnerError
	None
)

type Service struct {
	db db.DB
}

func NewService(db db.DB) Service {
	return Service{
		db: db,
	}
}

func (service *Service) CreateTodo(user model.User, title string) (*model.Todo, Error) {
	if user.CoupleID == nil {
		return nil, UserNoCoupleError
	}

	// context := context.Background() // not needed for create structure, but needed for DB if using context?
	// DB Adapter Create uses underlying GORM which might use background context implicitly if not provided.
    // Wait, GORM usually takes context in specific calls like WithContext.
    // My previous code: service.db.Adapter.Create(&todo).
    // GORM's Create doesn't take context as arg.
    // So context variable IS unused.

	todo := model.Todo{
		ID:        uuid.New().String(),
		CoupleID:  *user.CoupleID,
		Title:     title,
		Completed: false,
	}

	if err := service.db.Adapter.Create(&todo).Error; err != nil {
		return nil, DatabaseError
	}

	return &todo, None
}

func (service *Service) ListTodos(user model.User) ([]model.Todo, Error) {
	if user.CoupleID == nil {
		return nil, UserNoCoupleError
	}

	context := context.Background()
	var todos []model.Todo
	// Using generic Find correctly: returns (results, error)
	todos, err := gorm.G[model.Todo](service.db.Adapter).Where("couple_id = ?", *user.CoupleID).Find(context)
	if err != nil {
		return nil, DatabaseError
	}

	return todos, None
}

func (service *Service) GetTodo(user model.User, id string) (*model.Todo, Error) {
	if user.CoupleID == nil {
		return nil, UserNoCoupleError
	}

	context := context.Background()
	todo, err := gorm.G[model.Todo](service.db.Adapter).Where("id = ?", id).First(context)
	if err != nil {
		return nil, TodoNotFoundError
	}

	if todo.CoupleID != *user.CoupleID {
		return nil, NotTodoOwnerError
	}

	return &todo, None
}

func (service *Service) UpdateTodo(user model.User, id string, title *string, completed *bool) (*model.Todo, Error) {
	if user.CoupleID == nil {
		return nil, UserNoCoupleError
	}

	context := context.Background()
	todo, err := gorm.G[model.Todo](service.db.Adapter).Where("id = ?", id).First(context)
	if err != nil {
		return nil, TodoNotFoundError
	}

	if todo.CoupleID != *user.CoupleID {
		return nil, NotTodoOwnerError
	}

	if title != nil {
		todo.Title = *title
	}
	if completed != nil {
		todo.Completed = *completed
	}

	if err := service.db.Adapter.Save(&todo).Error; err != nil {
		return nil, DatabaseError
	}

	return &todo, None
}

func (service *Service) DeleteTodo(user model.User, id string) Error {
	if user.CoupleID == nil {
		return UserNoCoupleError
	}

	context := context.Background()
	todo, err := gorm.G[model.Todo](service.db.Adapter).Where("id = ?", id).First(context)
	if err != nil {
		return TodoNotFoundError
	}

	if todo.CoupleID != *user.CoupleID {
		return NotTodoOwnerError
	}

	if err := service.db.Adapter.Delete(&todo).Error; err != nil {
		return DatabaseError
	}

	return None
}
