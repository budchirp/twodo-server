package server

import (
	"twodo-server/internal/module"
	"twodo-server/internal/utils/response"

	"github.com/go-chi/chi/v5"
)

type Module struct {
	module.Module

	handler Handler
}

func New() Module {
	service := NewService()

	return Module{
		handler: NewHandler(service),
	}
}

func (module Module) Register(router *chi.Mux) {
	router.Route("/server", func(router chi.Router) {
		router.Get("/version", response.Adapt(module.handler.GetVersion))
	})
}
