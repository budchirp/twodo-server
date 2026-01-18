package db

import (
	"sync"
	model2 "twodo-server/internal/db/model"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DB struct {
	Adapter *gorm.DB
}

var (
	once     sync.Once
	instance DB
)

func Get() DB {
	return instance
}

func Load() error {
	var err error

	once.Do(func() {
		db, dbErr := gorm.Open(sqlite.Open("db.sqlite"), &gorm.Config{})
		if dbErr != nil {
			err = dbErr
			return
		}

		if migrateErr := db.AutoMigrate(&model2.User{}, &model2.Couple{}, &model2.Invite{}, &model2.Todo{}); migrateErr != nil {
			err = migrateErr
			return
		}

		instance = DB{
			Adapter: db,
		}
	})

	return err
}
