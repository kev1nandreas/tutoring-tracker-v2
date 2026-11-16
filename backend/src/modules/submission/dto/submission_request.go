package dto

// CreateSubmissionRequest: the meeting comes from the URL, the user from the JWT.
type CreateSubmissionRequest struct {
	Answer string `json:"answer"`
	Files  string `json:"files" binding:"required"`
}
