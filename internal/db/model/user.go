package model

import "time"

type User struct {
	ID string `gorm:"primaryKey" json:"id"`

	CoupleID *string `json:"couple_id"`
	Couple   *Couple `gorm:"foreignKey:CoupleID" json:"couple"`

	SentInvites     []Invite `gorm:"foreignKey:SenderID" json:"sent_invites"`
	ReceivedInvites []Invite `gorm:"foreignKey:ReceiverID" json:"received_invites"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
