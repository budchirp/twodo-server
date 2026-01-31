package models

import (
	"time"

	"twodo-server/internal/db/models"
)

type TodoResponse struct {
	ID string `json:"id"`

	Title   string `json:"title"`
	Content string `json:"content"`

	Completed bool `json:"completed"`

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func NewTodoResponse(todo models.Todo) TodoResponse {
	return TodoResponse{
		ID:        todo.ID,
		Title:     todo.Title,
		Content:   todo.Content,
		Completed: todo.Completed,
		CreatedAt: todo.CreatedAt.UTC().Format(time.RFC3339Nano),
		UpdatedAt: todo.UpdatedAt.UTC().Format(time.RFC3339Nano),
	}
}

func NewTodosResponse(todos []models.Todo) []TodoResponse {
	responses := make([]TodoResponse, 0, len(todos))

	for _, todo := range todos {
		responses = append(responses, NewTodoResponse(todo))
	}

	return responses
}
