package couple

import (
	"context"

	"twodo-server/internal/db"
	"twodo-server/internal/db/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Error int

const (
	UserNotFoundError Error = iota
	DatabaseError
	None
)

type Service struct {
	db db.DB
}

func NewService(db db.DB) Service {
	return Service{
		db: db,
	}
}

func (service *Service) LeaveCouple(user model.User) Error {
	context := context.Background()

	if user.CoupleID == nil {
		return None
	}

	couple := model.Couple{
		ID: uuid.New().String(),
	}

	if err := gorm.G[model.Couple](service.db.Adapter).Create(context, &couple); err != nil {
		return DatabaseError
	}

	user.CoupleID = &couple.ID
	if err := service.db.Adapter.Save(&user).Error; err != nil {
		return DatabaseError
	}

	return None
}