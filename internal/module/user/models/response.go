package models

import "twodo-server/internal/db/model"

type ListInvitesResponse struct {
	Sent     []model.Invite `json:"sent"`
	Received []model.Invite `json:"received"`
}
