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

type AuthUserResponseData struct {
		ID string `json:"id"`

		Username string `json:"username"`

		Profile struct {
			Name *string `json:"name"`
			Picture *string `json:"picture"`
		} 
}

type AuthUserResponse struct {
	Data AuthUserResponseData `json:"data"`
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

		var data AuthUserResponse
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			response.NewError("error.auth_server_error").Send(writer, http.StatusInternalServerError)
			return
		}

		ctx := context.WithValue(request.Context(), UserKey, data.Data)

		next.ServeHTTP(writer, request.WithContext(ctx))
	})
}
