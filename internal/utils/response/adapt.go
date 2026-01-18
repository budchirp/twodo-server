package response

import (
	"net/http"
)

func Adapt(handler func(request *http.Request) (int, ApiResponse)) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		status, response := handler(request)

		response.Send(writer, status)
	}
}
