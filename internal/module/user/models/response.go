package models

import (
	"time"

	"twodo-server/internal/db/models"
)

type CoupleResponse struct {
	ID string `json:"id"`

	Users []UserResponse `json:"users"`

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func NewCoupleResponse(couple *models.Couple) *CoupleResponse {
	if couple == nil {
		return nil
	}

	users := make([]UserResponse, 0, len(couple.Users))
	for _, user := range couple.Users {
		users = append(users, NewUserResponse(user))
	}

	return &CoupleResponse{
		ID:        couple.ID,
		Users:     users,
		CreatedAt: couple.CreatedAt.UTC().Format(time.RFC3339Nano),
		UpdatedAt: couple.UpdatedAt.UTC().Format(time.RFC3339Nano),
	}
}

type UserResponse struct {
	ID string `json:"id"`

	Username string `json:"username"`
	Name     string `json:"name"`

	Picture *string `json:"picture"`

	Couple *CoupleResponse `json:"couple"`
}

func NewUserResponse(user models.User) UserResponse {
	return UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Name:     user.Name,
		Picture:  user.Picture,
		Couple:   NewCoupleResponse(user.Couple),
	}
}

type InviteResponse struct {
	ID string `json:"id"`

	User UserResponse `json:"user"`

	Type   string `json:"type"` // sent, received
	Status string `json:"status"`

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func NewInvitesResponse(sent []models.Invite, received []models.Invite) []InviteResponse {
	responses := make([]InviteResponse, 0, len(sent)+len(received))

	for _, invite := range sent {
		responses = append(responses, InviteResponse{
			ID:        invite.ID,
			User:      NewUserResponse(*invite.Receiver),
			Type:      "sent",
			Status:    invite.Status,
			CreatedAt: invite.CreatedAt.UTC().Format(time.RFC3339Nano),
			UpdatedAt: invite.UpdatedAt.UTC().Format(time.RFC3339Nano),
		})
	}

	for _, invite := range received {
		responses = append(responses, InviteResponse{
			ID:        invite.ID,
			User:      NewUserResponse(*invite.Sender),
			Type:      "received",
			Status:    invite.Status,
			CreatedAt: invite.CreatedAt.UTC().Format(time.RFC3339Nano),
			UpdatedAt: invite.UpdatedAt.UTC().Format(time.RFC3339Nano),
		})
	}

	return responses
}
