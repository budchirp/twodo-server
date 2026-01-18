package app

import (
	"log"
	"net/http"
	"strconv"
	"sync"
	"twodo-server/internal/config"

	"github.com/go-chi/chi/v5"
)

type App struct {
	Router *chi.Mux
}

var (
	once     sync.Once
	instance App
)

func New() *App {
	once.Do(func() {
		instance = App{
			Router: chi.NewRouter(),
		}
	})

	return &instance
}

func (app *App) Listen() error {
	config := config.Get()

	port := strconv.Itoa(config.Port)

	server := &http.Server{
		Addr:    ":" + port,
		Handler: app.Router,
	}

	log.Printf("Listening on port %s\n", port)

	return server.ListenAndServe()
}
