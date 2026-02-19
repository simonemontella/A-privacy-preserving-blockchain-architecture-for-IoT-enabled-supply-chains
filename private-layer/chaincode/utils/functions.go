package utils

import (
	"encoding/json"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func FormatTime(seconds int64, nanos int64) string {
	tm := time.Unix(seconds, nanos)
	return tm.Format(time.RFC3339)
}

func JsonFormat(data any) ([]byte, error) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	return jsonBytes, nil
}

func PutState(ctx contractapi.TransactionContextInterface, key string, value any) error {
	jsonStr, err := JsonFormat(value)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(key, jsonStr)
}
