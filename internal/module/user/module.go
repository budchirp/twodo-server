package user

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
	router.Route("/user", func(router chi.Router) {
		router.Use(auth.NewMiddleware().Apply)

		router.Post("/initialize", response.Adapt(module.handler.Initialize))
	
		router.Post("/invite", response.Adapt(module.handler.SendInvite))
		router.Get("/invite", response.Adapt(module.handler.ListInvites))
		router.Put("/invite/{id}", response.Adapt(module.handler.HandleInvite))
		router.Delete("/invite/{id}", response.Adapt(module.handler.DeleteInvite))
	})
}
