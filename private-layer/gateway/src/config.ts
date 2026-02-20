export const config = {
  mqtt: {
    broker: process.env.MQTT_BROKER || "mqtt://localhost:1883",
    topic: process.env.MQTT_TOPIC || "sensors/+/data",
  },
  fabric: {
    mspId: process.env.FABRIC_MSP_ID || "Org1MSP",
    channelName: process.env.FABRIC_CHANNEL || "supplychannel",
    chaincodeName: process.env.FABRIC_CHAINCODE || "supply",
    connectionProfile: process.env.FABRIC_CONNECTION_PROFILE || "./connection-org1.json",
    certificatePath: process.env.FABRIC_CERT_PATH || "./org1-cert.pem",
    privateKeyPath: process.env.FABRIC_KEY_PATH || "./org1-private-key.pem",
  },
  offChain: {
    dbPath: process.env.OFF_CHAIN_DB || "./off-chain.db",
  },
  encryption: {
    algorithm: "aes-256-gcm",
    encryptionKey: process.env.ENCRYPTION_KEY || "0".repeat(64),
  },
};
