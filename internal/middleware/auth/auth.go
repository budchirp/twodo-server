package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"twodo-server/internal/config"
	"twodo-server/internal/utils/response"
)

type Middleware struct {
}

func NewMiddleware() Middleware {
	return Middleware{}
}

type UserResponse struct {
	Data struct {
		ID string `json:"id"`

		Username string `json:"username"`

		Profile struct {
			Picture *string `json:"picture"`
		} `json:"profile"`
	} `json:"data"`
}

func (middleware Middleware) Apply(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter,
		request *http.Request) {
		header := request.Header.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			response.NewError("error.unauthorized").Send(writer, http.StatusUnauthorized)
			return
		}

		config := config.Get()

		client := &http.Client{}

		req, err := http.NewRequest("GET", fmt.Sprintf("%s/user", config.AuthApiUrl), nil)
		if err != nil {
			response.NewError("error.internal_server_error").Send(writer, http.StatusInternalServerError)
			return
		}

		req.Header.Set("Authorization", header)

		resp, err := client.Do(req)
		defer resp.Body.Close()

		if err != nil {
			response.NewError("error.auth_server_unavailable").Send(writer, http.StatusServiceUnavailable)
			return
		}

		if resp.StatusCode != http.StatusOK {
			response.NewError("error.unauthorized").Send(writer, http.StatusUnauthorized)
			return
		}

		var data UserResponse
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			response.NewError("error.auth_server_error").Send(writer, http.StatusInternalServerError)
			return
		}

		ctx := context.WithValue(request.Context(), UserKey, AuthUser{
			ID:       data.Data.ID,
			Username: data.Data.Username,
			Picture:  data.Data.Profile.Picture,
		})

		next.ServeHTTP(writer, request.WithContext(ctx))
	})
}
