package model

import (
	"time"
)

type Couple struct {
	ID string `gorm:"primaryKey" json:"id"`

	Users []User `gorm:"foreignKey:CoupleID" json:"users"`
	Todos []Todo `gorm:"foreignKey:CoupleID" json:"todos"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
