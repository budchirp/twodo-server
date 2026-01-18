package auth

import (
	"context"

	"twodo-server/internal/db"
	"twodo-server/internal/db/model"

	"gorm.io/gorm"
)

type key string

const UserIDKey key = "UserID"

func GetUserID(requestContext context.Context, db db.DB) (*string, *model.User) {
	context := context.Background()

	if id, ok := requestContext.Value(UserIDKey).(string); ok {
		user, err := gorm.G[model.User](db.Adapter).Where("id = ?", id).First(context)
		if err != nil {
			return &id, nil
		}

		return &id, &user
	}

	return nil, nil
}
