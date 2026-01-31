package auth

import (
	"context"

	"twodo-server/internal/db"
	"twodo-server/internal/db/models"

	"gorm.io/gorm"
)

type key string

const (
	UserKey key = "User"
)

type AuthUser struct {
	ID string

	Username string

	Picture *string
}

func GetUser(requestContext context.Context, db db.DB) (*AuthUser, *models.User) {
	context := context.Background()

	if user, ok := requestContext.Value(UserKey).(AuthUser); ok {
		db, err := gorm.G[models.User](db.Adapter).Preload("Couple.Users", nil).Where("id = ?", user.ID).First(context)
		if err != nil {
			return &user, nil
		}

		return &user, &db
	}

	return nil, nil
}
