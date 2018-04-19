package api

type Weather interface {
	Category(latitude, longitude float64) string
}

type CategoryItem struct {
	Timestamp int64  `json:"timestamp"`
	Main      string `json:"main"`
	Detailed  string `json:"detailed"`
}

type CategoryResponse struct {
	Items []CategoryItem `json:"items"`
}
