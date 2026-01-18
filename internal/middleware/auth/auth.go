package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"twodo-server/internal/utils/response"
)

type Middleware struct {
}

func NewMiddleware() Middleware {
	return Middleware{}
}

type userResponse struct {
	Data struct {
		ID string `json:"id"`
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

		client := &http.Client{}

		req, err := http.NewRequest("GET", "http://localhost:8080/user", nil)
		if err != nil {
			response.NewError("error.internal_server_error").Send(writer, http.StatusInternalServerError)
			return
		}

		req.Header.Set("Authorization", header)

		resp, err := client.Do(req)
		if err != nil {
			response.NewError("error.auth_server_unavailable").Send(writer, http.StatusServiceUnavailable)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			response.NewError("error.unauthorized").Send(writer, http.StatusUnauthorized)
			return
		}

		var userResp userResponse
		if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
			response.NewError("error.auth_server_error").Send(writer, http.StatusInternalServerError)
			return
		}

		// Inject user ID into context
		ctx := context.WithValue(request.Context(), UserIDKey, userResp.Data.ID)
		next.ServeHTTP(writer, request.WithContext(ctx))
	})
}
