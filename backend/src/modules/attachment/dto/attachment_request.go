package dto

// AttachmentInput is one attachment to add.
type AttachmentInput struct {
	Name string `json:"name" binding:"required"`
	Type string `json:"type" binding:"required"`
	Link string `json:"link" binding:"required"`
}

// CreateAttachmentsRequest: the meeting comes from the URL, the creator from the JWT.
type CreateAttachmentsRequest struct {
	Attachments []AttachmentInput `json:"attachments" binding:"required,min=1,max=50,dive"`
}
