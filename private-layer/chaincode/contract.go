package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"

	"supplychain/models"
	"supplychain/utils"
)

type MainContract struct {
	contractapi.Contract
}

func (contract *MainContract) CreateLot(ctx contractapi.TransactionContextInterface, lotID string) error {
	msp, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return err
	}

	if err := utils.CanCreateLot(msp); err != nil {
		return err
	}

	creator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return err
	}
	now := utils.FormatTime(txTimestamp.Seconds, int64(txTimestamp.Nanos))
	lot := models.Lot{
		DocumentType:  "LOT",
		LotID:         lotID,
		CreatedAt:     now,
		CreatedBy:     creator,
		Status:        models.LOT_CREATED,
		LastUpdatedAt: now,
		LastUpdatedBy: creator,
		EventCount:    0,
		LastEventHash: "",
	}

	exists, err := contract.ObjectExistsByKey(ctx, models.GetLotKey(lotID))
	if err != nil {
		return err
	}

	if exists {
		return fmt.Errorf("lot %s already exists", lotID)
	}

	return utils.PutState(ctx, models.GetLotKey(lotID), lot)
}

func (c *MainContract) LogEvent(
	ctx contractapi.TransactionContextInterface,
	lotID string,
	evType string,
	payloadRef string,
	commitment string,
) (string, error) {
	lot, err := c.GetLot(ctx, lotID)
	if err != nil {
		return "", err
	}
	if lot == nil {
		return "", fmt.Errorf("unknown lot: %s", lotID)
	}

	msp, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return "", err
	}

	eventType := models.EventType(strings.TrimSpace(evType))
	if err := utils.CanAppendEvent(msp, eventType); err != nil {
		return "", err
	}

	if payloadRef == "" {
		return "", fmt.Errorf("payloadRef empty")
	}
	if len(commitment) != 64 {
		return "", fmt.Errorf("commitment must be sha256 hex (64 chars)")
	}

	txTime, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", err
	}

	now := utils.FormatTime(txTime.Seconds, int64(txTime.Nanos))
	eventMaker, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return "", err
	}

	seq := lot.EventCount + 1
	prevEvent := ""
	if seq > 1 {
		prevEvent = lot.LastEventHash
	}

	ev := models.LotEvent{
		DocumentType:  "EVENT",
		LotID:         lotID,
		Seq:           seq,
		Type:          eventType,
		CreatedAt:     now,
		CreatedBy:     eventMaker,
		PayloadRef:    payloadRef,
		Commitment:    commitment,
		PrevEventHash: prevEvent,
	}
	ev.EventHash = ev.GetHash()
	ev.NextLotStatus, err = ev.GetNextLotStatus()
	if err != nil {
		return "", err
	}

	if err := utils.PutState(ctx, models.GetEventKey(lotID, seq), &ev); err != nil {
		return "", err
	}

	lot.Status = ev.NextLotStatus
	lot.LastUpdatedAt = now
	lot.LastUpdatedBy = eventMaker
	lot.EventCount = seq
	lot.LastEventHash = ev.EventHash

	if err := utils.PutState(ctx, models.GetLotKey(lotID), lot); err != nil {
		return "", err
	}

	return ev.EventHash, nil
}

func (contract *MainContract) GetLot(ctx contractapi.TransactionContextInterface, lotID string) (*models.Lot, error) {
	lotData, err := ctx.GetStub().GetState(models.GetLotKey(lotID))
	if err != nil {
		return nil, err
	}

	if lotData == nil {
		return nil, nil
	}

	var lot models.Lot
	if err := json.Unmarshal(lotData, &lot); err != nil {
		return nil, err
	}

	return &lot, nil
}

func (c *MainContract) GetEvents(ctx contractapi.TransactionContextInterface, lotID string) ([]*models.LotEvent, error) {
	it, err := ctx.GetStub().GetStateByRange(models.GetEventStart(lotID), models.GetEventEnd(lotID))
	if err != nil {
		return nil, err
	}
	defer it.Close()

	var out []*models.LotEvent
	for it.HasNext() {
		kv, err := it.Next()
		if err != nil {
			return nil, err
		}
		var ev models.LotEvent
		if err := json.Unmarshal(kv.Value, &ev); err != nil {
			return nil, err
		}
		out = append(out, &ev)
	}

	return out, nil
}

func (contract *MainContract) ObjectExistsByKey(ctx contractapi.TransactionContextInterface, objectKey string) (bool, error) {
	data, err := ctx.GetStub().GetState(objectKey)
	if err != nil {
		return false, err
	}

	return data != nil, nil
}
