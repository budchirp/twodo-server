package models

type SendInviteRequest struct {
	User string `json:"user"`
}

type HandleInviteRequest struct {
	Action string `json:"action"`
}
