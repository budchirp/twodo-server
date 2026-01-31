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

		router.Post("/", response.Adapt(module.handler.Create))
		router.Get("/all", response.Adapt(module.handler.GetAll))
		router.Get("/{id}", response.Adapt(module.handler.Get))
		router.Patch("/{id}", response.Adapt(module.handler.Update))
		router.Delete("/{id}", response.Adapt(module.handler.Delete))
	})
}
