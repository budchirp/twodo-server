package models

type CreateTodoRequest struct {
	Title   string `json:"title"`
}

type UpdateTodoRequest struct {
	Title     *string `json:"title"`
	Content   *string `json:"content"`
	Completed *bool   `json:"completed"`
}
