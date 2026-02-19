package models

type LotStatus string

const (
	LOT_CREATED      LotStatus = "CREATED"
	LOT_PROCESSING   LotStatus = "PROCESSING"
	LOT_PROCESSED    LotStatus = "PROCESSED"
	LOT_TRANSPORTING LotStatus = "TRANSPORTING"
	LOT_TRANSPORTED  LotStatus = "TRANSPORTED"
	LOT_COMPLETED    LotStatus = "COMPLETED"
)

type Lot struct {
	DocumentType  string    `json:"documentType"`
	LotID         string    `json:"lotId"`
	CreatedAt     string    `json:"createdAt"`
	CreatedBy     string    `json:"createdBy"`
	Status        LotStatus `json:"status"`
	LastUpdatedAt string    `json:"lastUpdatedAt"`
	LastUpdatedBy string    `json:"lastUpdatedBy"`
	EventCount    int       `json:"eventCount"`
	LastEventHash string    `json:"lastEventHash"`
}

func GetLotKey(lotID string) string {
	return "LOT-" + lotID
}
