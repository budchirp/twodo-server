package user

import (
	"context"

	"twodo-server/internal/db"
	"twodo-server/internal/db/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Error int

const (
	DatabaseError Error = iota
	UserNotFoundError
	InviteNotFoundError
	CoupleFullError
	SelfInviteError
	NotInviteReceiverError
	NotInviteSenderError
	InvalidActionError
	None
)

type InviteAction string

const (
	InviteActionAccept InviteAction = "accept"
	InviteActionReject InviteAction = "reject"
)

type Service struct {
	db db.DB
}

func NewService(db db.DB) Service {
	return Service{
		db: db,
	}
}

func (service *Service) InitializeUser(id string) Error {
	couple := model.Couple{
		ID: uuid.New().String(),
	}

	if err := service.db.Adapter.Create(&couple).Error; err != nil {
		return DatabaseError
	}

	user := model.User{
		ID:       id,
		CoupleID: &couple.ID,
	}

	if err := service.db.Adapter.Create(&user).Error; err != nil {
		return DatabaseError
	}

	return None
}

func (service *Service) CreateInvite(user model.User, id string) (*model.Invite, Error) {
	if user.ID == id {
		return nil, SelfInviteError
	}

	context := context.Background()

	receiver, err := gorm.G[model.User](service.db.Adapter).Where("id = ?", id).First(context)
	if err != nil {
		return nil, UserNotFoundError
	}

	invite := model.Invite{
		ID:         uuid.New().String(),
		SenderID:   user.ID,
		ReceiverID: receiver.ID,
		Status:     "pending",
	}

	if err := service.db.Adapter.Create(&invite).Error; err != nil {
		return nil, DatabaseError
	}

	return &invite, None
}

func (service *Service) HandleInvite(action string, user model.User, id string) Error {
	if action != string(InviteActionAccept) && action != string(InviteActionReject) {
		return InvalidActionError
	}

	context := context.Background()

	invite, err := gorm.G[model.Invite](service.db.Adapter).Where("id = ?", id).First(context)
	if err != nil {
		return InviteNotFoundError
	}

	receiver, err := gorm.G[model.User](service.db.Adapter).Where("id = ?", invite.ReceiverID).First(context)
	if err != nil {
		return UserNotFoundError
	}

	if user.ID != receiver.ID {
		return NotInviteReceiverError
	}

	if InviteAction(action) == InviteActionReject {
		invite.Status = "rejected"
		if err := service.db.Adapter.Save(&invite).Error; err != nil {
			return DatabaseError
		}
		return None
	}

	sender, err := gorm.G[model.User](service.db.Adapter).Where("id = ?", invite.SenderID).First(context)
	if err != nil {
		return UserNotFoundError
	}

	var count int64
	service.db.Adapter.Model(&model.User{}).Where("couple_id = ?", sender.CoupleID).Count(&count)

	if count >= 2 {
		return CoupleFullError
	}

	receiver.CoupleID = sender.CoupleID
	if err := service.db.Adapter.Save(&receiver).Error; err != nil {
		return DatabaseError
	}

	invite.Status = "accepted"
	if err := service.db.Adapter.Save(&invite).Error; err != nil {
		return DatabaseError
	}

	return None
}

func (service *Service) DeleteInvite(user model.User, id string) Error {
	context := context.Background()

	invite, err := gorm.G[model.Invite](service.db.Adapter).Where("id = ?", id).First(context)
	if err != nil {
		return InviteNotFoundError
	}

	if invite.SenderID != user.ID {
		return NotInviteSenderError
	}

	if err := service.db.Adapter.Delete(&invite).Error; err != nil {
		return DatabaseError
	}

	return None
}

func (service *Service) GetInvites(user model.User) ([]model.Invite, []model.Invite, Error) {
	context := context.Background()

	sent, err := gorm.G[model.Invite](service.db.Adapter).Where("sender_id = ?", user.ID).Find(context)
	if err != nil {
		return nil, nil, DatabaseError
	}

	received, err := gorm.G[model.Invite](service.db.Adapter).Where("receiver_id = ?", user.ID).Find(context)
	if err != nil {
		return nil, nil, DatabaseError
	}

	return sent, received, None
}
