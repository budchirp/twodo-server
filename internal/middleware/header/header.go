package header

import "net/http"

type Middleware struct {
}

func NewMiddleware() Middleware {
	return Middleware{}
}

func (middleware Middleware) Apply(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter,
		request *http.Request) {
		writer.Header().Set("Content-Type", "application/json")

		next.ServeHTTP(writer, request)
	})
}
