package dto

import "time"

// FormInfo is what the public form shows before it is filled in.
type FormInfo struct {
	TutorialName string `json:"tutorial_name"`
	TutorName    string `json:"tutor_name"`
	// Open is true when the tutorial is done and its feedback switch is on.
	Open bool `json:"open"`
}

type SubmitRequest struct {
	Email string `json:"email" binding:"required,email,max=100"`
	// 1-5: how well the tutor delivered the material, how interactive, and wanting to learn with them again.
	DeliveryRating    int `json:"delivery_rating" binding:"required,min=1,max=5"`
	InteractiveRating int `json:"interactive_rating" binding:"required,min=1,max=5"`
	LearnAgainRating  int `json:"learn_again_rating" binding:"required,min=1,max=5"`
	// UnclearTopics: what the student did not understand and wants covered next.
	UnclearTopics string `json:"unclear_topics" binding:"required,max=2000"`
	// Message: impressions and advice for the tutor.
	Message string `json:"message" binding:"required,max=2000"`
}

// Status tells a student whether the tutorial is locked behind the form.
type Status struct {
	Required bool `json:"required"`
	// Code is the tutorial code the public form lives under.
	Code string `json:"code"`
}

type Item struct {
	DeliveryRating    int       `json:"delivery_rating"`
	InteractiveRating int       `json:"interactive_rating"`
	LearnAgainRating  int       `json:"learn_again_rating"`
	UnclearTopics     string    `json:"unclear_topics"`
	Message           string    `json:"message"`
	CreatedAt         time.Time `json:"created_at"`
}

type Summary struct {
	Count          int     `json:"count"`
	AvgDelivery    float64 `json:"avg_delivery"`
	AvgInteractive float64 `json:"avg_interactive"`
	AvgLearnAgain  float64 `json:"avg_learn_again"`
	Items          []Item  `json:"items"`
}
