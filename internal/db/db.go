package db

import (
	model2 "twodo-server/internal/db/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DB struct {
	Adapter *gorm.DB
}

var (
	instance DB
)

func Get() DB {
	return instance
}

func Load() error {
	db, err := gorm.Open(sqlite.Open("db.sqlite"), &gorm.Config{})
	if err != nil {
		return err
	}

	if err := db.AutoMigrate(&model2.User{}, &model2.Couple{}, &model2.Invite{}, &model2.Todo{}); err != nil {
		return err
	}

	instance = DB{
		Adapter: db,
	}

	return nil
}
