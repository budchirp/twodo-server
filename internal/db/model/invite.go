package model

import "time"

type Invite struct {
	ID string `gorm:"primaryKey" json:"id"`

	SenderID string `json:"sender_id"`
	Sender   *User  `gorm:"foreignKey:SenderID" json:"sender"`

	ReceiverID string `json:"receiver_id"`
	Receiver   *User  `gorm:"foreignKey:ReceiverID" json:"receiver"`

	Status string `json:"status"` // "pending", "accepted", "declined"

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
