# IoT Gateway

Backend gateway che connette sensori IoT a Hyperledger Fabric con storage off-chain criptato.

## Configurazione

- **MQTT_BROKER**: URL del broker MQTT
- **MQTT_TOPIC**: Topic MQTT per ascoltare sensori
- **FABRIC\_\***: Credenziali e connessione Hyperledger Fabric
- **ENCRYPTION_KEY**: Chiave AES-256 hex (64 caratteri)

## Formato Messaggi MQTT

Ogni evento MQTT deve avere questo formato JSON:

```json
{
  "sensorId": "sensor-001",
  "lotId": "lot-12345",
  "timestamp": "2026-02-20T10:30:00Z",
  "eventType": "ORIGIN",
  "value": 5.2,
  "unit": "°C",
  "metadata": {
    "location": "facility-a"
  }
}
```

### Event Types

- `ORIGIN` - Creazione del lotto
- `PROCESSING` - Inizio processamento
- `PROCESSED` - Processamento completato
- `TRANSPORTING` - Inizio trasporto
- `TRANSPORTED` - Fine trasporto
- `COMPLETION` - Consegna completata
- `INSPECTION` - Ispezione

## Architettura

1. **MQTT Client**: Ascolta sensori IoT
2. **Fabric Client**: Registra eventi nel ledger
3. **Off-Chain Store**: Memorizza payload criptati in SQLite
4. **Crypto**: Criptazione AES-256-GCM e commitment SHA-256

## Flusso

1. Riceve evento MQTT → Crea lotto se nuovo
2. Criptografa il payload → Calcola commitment SHA-256
3. Salva in SQLite con payloadRef
4. Registra nel chaincode (Fabric) con payloadRef e commitment
5. Payload raw rimane off-chain, ledger non contiene dati sensibili
