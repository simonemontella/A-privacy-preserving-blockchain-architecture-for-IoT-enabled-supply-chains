package models

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
)

type EventType string

const (
	// Event Types
	EVENT_ORIGIN       EventType = "ORIGIN"       // Org1
	EVENT_PROCESSING   EventType = "PROCESSING"   // Org2
	EVENT_PROCESSED    EventType = "PROCESSED"    // Org2
	EVENT_TRANSPORTING EventType = "TRANSPORTING" // Org3
	EVENT_TRANSPORTED  EventType = "TRANSPORTED"  // Org3
	EVENT_COMPLETION   EventType = "COMPLETION"   // Org4
	EVENT_INSPECTION   EventType = "INSPECTION"   //TODO check
)

type LotEvent struct {
	DocumentType string `json:"documentType"` // "EVENT"
	LotID        string `json:"lotId"`
	Seq          int    `json:"seq"`

	Type          EventType `json:"type"`
	NextLotStatus LotStatus `json:"statusAfter"`

	CreatedAt string `json:"createdAt"`
	CreatedBy string `json:"createdBy"`

	PayloadRef string `json:"payloadRef"`
	Commitment string `json:"commitment"` // sha256 hex (64)

	PrevEventHash string `json:"prevEventHash,omitempty"`
	EventHash     string `json:"eventHash"`
}

func GetEventKey(lotID string, seq int) string {
	return "EVENT-" + lotID + "-" + fmt.Sprintf("%06d", seq)
}

func (event LotEvent) GetNextLotStatus() (LotStatus, error) {
	switch event.Type {
	case EVENT_ORIGIN:
		return LOT_CREATED, nil
	case EVENT_PROCESSING:
		return LOT_PROCESSING, nil
	case EVENT_PROCESSED:
		return LOT_PROCESSED, nil
	case EVENT_TRANSPORTING:
		return LOT_TRANSPORTING, nil
	case EVENT_TRANSPORTED:
		return LOT_TRANSPORTED, nil
	case EVENT_COMPLETION:
		return LOT_COMPLETED, nil
	case EVENT_INSPECTION:
		return "", nil

	default:
		return "", fmt.Errorf("unknown eventType: %s", event.Type)
	}
}

func (event *LotEvent) GetHash() string {
	data, _ := json.Marshal(event)
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func GetEventStart(lotID string) string {
	return "EVENT-" + lotID + "-000000"
}

func GetEventEnd(lotID string) string {
	return "EVENT-" + lotID + "-999999"
}
