package models

type SendInviteRequest struct {
	Username string `json:"username"`
}

type HandleInviteRequest struct {
	Action string `json:"action"`
}
