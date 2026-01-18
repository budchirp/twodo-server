package main

import (
	"log"
	"os"
	"twodo-server/internal/app"
	"twodo-server/internal/config"
	"twodo-server/internal/db"
	"twodo-server/internal/middleware"
	"twodo-server/internal/middleware/header"
	"twodo-server/internal/module"
	"twodo-server/internal/module/couple"
	"twodo-server/internal/module/server"
	"twodo-server/internal/module/todo"
	"twodo-server/internal/module/user"
	"twodo-server/internal/utils/i18n/bundle"

	"github.com/go-chi/chi/v5"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatalf("Error loading config: %v\n", err)
	}

	if err := bundle.Load("i18n"); err != nil {
		log.Fatalf("Error loading translations: %v\n", err)
	}

	if err := db.Load(); err != nil {
		log.Fatalf("Error loading database: %v\n", err)
	}

	app := app.New()

	middlewares := []middleware.Middleware{
		header.NewMiddleware(),
	}

	app.Router.Group(func(router chi.Router) {
		for _, middleware := range middlewares {
			router.Use(middleware.Apply)
		}
	})

	modules := []module.Module{
		server.New(),
		couple.New(),
		user.New(),
		todo.New(),
	}

	for _, module := range modules {
		module.Register(app.Router)
	}

	if err := app.Listen(); err != nil {
		log.Printf("Error starting app: %v\n", err)
		os.Exit(1)
	}
}
