package config

import (
	"os"
	"strconv"
	"sync"
)

import "github.com/joho/godotenv"

type Config struct {
	Port int
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

		instance = Config{
			Port: port,
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
