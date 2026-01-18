package server

type Service struct{}

func NewService() Service {
	return Service{}
}

func (service *Service) GetVersion() string {
	return "v0.1.0"
}
