package model

import "time"

type Todo struct {
	ID string `gorm:"primaryKey" json:"id"`

	CoupleID string  `json:"couple_id"`
	Couple   *Couple `gorm:"foreignKey:CoupleID" json:"couple"`

	Title     string `json:"title"`
	Completed bool   `json:"completed"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
