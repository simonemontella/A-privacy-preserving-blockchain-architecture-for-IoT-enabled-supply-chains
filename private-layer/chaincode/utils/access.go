package utils

import (
	"fmt"

	"supplychain/models"
)

const (
	Org1MSP = "Org1MSP"
	Org2MSP = "Org2MSP"
	Org3MSP = "Org3MSP"
)

func CanCreateLot(msp string) error {
	if msp != Org1MSP {
		return fmt.Errorf("CreateLot allowed only for %s", Org1MSP)
	}
	return nil
}

func CanAppendEvent(msp string, eventType models.EventType) error {
	switch eventType {
	case models.EVENT_ORIGIN:
		return mustBe(msp, Org1MSP)
	case models.EVENT_PROCESSING, models.EVENT_PROCESSED:
		return mustBe(msp, Org1MSP)
	case models.EVENT_TRANSPORTING, models.EVENT_TRANSPORTED:
		return mustBe(msp, Org2MSP)
	case models.EVENT_COMPLETION:
		return mustBe(msp, Org3MSP)
	case models.EVENT_INSPECTION:
		return nil
	default:
		return fmt.Errorf("unknown event type: %s", eventType)
	}
}

func mustBe(msp, required string) error {
	if msp != required {
		return fmt.Errorf("event allowed only for %s", required)
	}
	return nil
}
