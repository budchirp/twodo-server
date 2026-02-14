package auth

import (
	"context"

	"twodo-server/internal/db"
	"twodo-server/internal/db/models"

	"gorm.io/gorm"
)

type key string

const (
	UserKey key = "Username"
)

func GetUser(requestContext context.Context, db db.DB) (*AuthUserResponseData, *models.User) {
	context := context.Background()

	if user, ok := requestContext.Value(UserKey).(AuthUserResponseData); ok {
		db, err := gorm.G[models.User](db.Adapter).Preload("Couple.Users", nil).Where("id = ?", user.ID).First(context)
		if err != nil {
			return &user, nil
		}

		return &user, &db
	}

	return nil, nil
}
