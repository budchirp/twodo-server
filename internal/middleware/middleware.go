package middleware

import "net/http"

type Middleware interface {
	Apply(next http.Handler) http.Handler
}
