package bundle

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type Bundle struct {
	mutex sync.RWMutex

	data map[string]map[string]string
}

var (
	once     sync.Once
	instance *Bundle
)

func Get() *Bundle {
	return instance
}

func Load(dir string) error {
	var err error

	once.Do(func() {
		files, readError := os.ReadDir(dir)
		if readError != nil {
			err = readError
			return
		}

		data := make(map[string]map[string]string)

		for _, f := range files {
			if f.IsDir() || !strings.HasSuffix(f.Name(), ".json") {
				continue
			}

			lang := strings.TrimSuffix(f.Name(), ".json")
			path := filepath.Join(dir, f.Name())

			raw, readError := os.ReadFile(path)
			if readError != nil {
				err = readError
				return
			}

			var messages map[string]string
			if unmarshallError := json.Unmarshal(raw, &messages); unmarshallError != nil {
				err = unmarshallError
				return
			}

			data[lang] = messages
		}

		if len(data) == 0 {
			err = errors.New("no translations loaded")
			return
		}

		instance = &Bundle{
			data: data,
		}
	})

	return err
}

func (bundle *Bundle) GetMessages(language string) map[string]string {
	bundle.mutex.RLock()
	defer bundle.mutex.RUnlock()

	if msg, ok := bundle.data[language]; ok {
		return msg
	}

	return nil
}
