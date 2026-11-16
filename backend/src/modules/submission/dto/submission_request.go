package dto

// CreateSubmissionRequest: the meeting comes from the URL, the user from the JWT.
type CreateSubmissionRequest struct {
	Answer string `json:"answer"`
	Files  string `json:"files" binding:"required"`
}

// GradeSubmissionRequest: grade is 0-100 (a pointer so that 0 counts as given).
type GradeSubmissionRequest struct {
	Grade    *int   `json:"grade" binding:"required,gte=0,lte=100"`
	Feedback string `json:"feedback" binding:"max=500"`
}
