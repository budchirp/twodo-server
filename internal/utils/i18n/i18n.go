package i18n

import (
	"errors"
	"net/http"
	"sync"
	"twodo-server/internal/utils/i18n/bundle"
)

type I18n struct {
	messages map[string]string
}

var (
	once     sync.Once
	instance I18n
)

func Get() I18n {
	return instance
}

func Load(request *http.Request) error {
	language := request.Header.Get("Accept-Language")
	if language == "" {
		language = "en"
	}

	var err error

	once.Do(func() {
		bundle := bundle.Get()

		messages := bundle.GetMessages(language)
		if messages == nil {
			err = errors.New("language not found: " + language)
			return
		}

		instance = I18n{
			messages: messages,
		}
	})

	return err
}

func (i18n I18n) T(key string) string {
	if value, exists := i18n.messages[key]; exists {
		return value
	}

	return key
}
