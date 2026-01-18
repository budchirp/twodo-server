package config

import (
	"os"
	"strconv"
	"sync"
)

import "github.com/joho/godotenv"

type Config struct {
	Port int

	AuthApiUrl string
}

var (
	once     sync.Once
	instance Config
)

func Get() Config {
	return instance
}

func Load() error {
	var err error

	once.Do(func() {
		_ = godotenv.Load()

		port, portErr := GetKeyAsInt("PORT", 8080)
		if portErr != nil {
			err = portErr
			return
		}

		authApiUrl := GetKeyAsString("AUTH_API_URL", "http://localhost:8000")

		instance = Config{
			Port:       port,
			AuthApiUrl: authApiUrl,
		}
	})

	return err
}

func GetKeyAsInt(key string, defaultValue int) (int, error) {
	env := os.Getenv(key)
	if env == "" {
		return defaultValue, nil
	}

	value, err := strconv.Atoi(env)
	if err != nil {
		return 0, err
	}

	return value, nil
}

func GetKeyAsString(key string, defaultValue string) string {
	env := os.Getenv(key)
	if env == "" {
		return defaultValue
	}

	return env
}
