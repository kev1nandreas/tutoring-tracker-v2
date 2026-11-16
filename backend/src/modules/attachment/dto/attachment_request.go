package dto

// UploadTicketRequest asks for permission to upload one file to a meeting.
type UploadTicketRequest struct {
	Name string `json:"name" binding:"required,max=100"`
	Type string `json:"type" binding:"required"`
	Size int64  `json:"size" binding:"required,gt=0"`
}

// CompletedUpload is a file that was uploaded with a ticket and should now be saved.
type CompletedUpload struct {
	Key  string `json:"key" binding:"required"`
	Name string `json:"name" binding:"required,max=100"`
	Type string `json:"type" binding:"required"`
}

// CompleteUploadsRequest registers uploaded files (up to 20) on a meeting.
type CompleteUploadsRequest struct {
	Items []CompletedUpload `json:"items" binding:"required,min=1,max=20,dive"`
}
