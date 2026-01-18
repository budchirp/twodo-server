package todo

import (
	"twodo-server/internal/db"
	"twodo-server/internal/middleware/auth"
	"twodo-server/internal/module"
	"twodo-server/internal/utils/response"

	"github.com/go-chi/chi/v5"
)

type Module struct {
	module.Module

	handler Handler
}

func New() Module {
	db := db.Get()

	return Module{
		handler: NewHandler(db),
	}
}

func (module Module) Register(router *chi.Mux) {
	router.Route("/todo", func(router chi.Router) {
		router.Use(auth.NewMiddleware().Apply)

		router.Post("/", response.Adapt(module.handler.CreateTodo))
		router.Get("/", response.Adapt(module.handler.ListTodos))
		router.Get("/{id}", response.Adapt(module.handler.GetTodo))
		router.Put("/{id}", response.Adapt(module.handler.UpdateTodo))
		router.Delete("/{id}", response.Adapt(module.handler.DeleteTodo))
	})
}
