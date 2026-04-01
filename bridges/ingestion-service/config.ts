import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
    server: {
        httpPort: process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 3000,
        mqttBrokerUrl: process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org',
    },
    crypto: {
        secretKey: process.env.CRYPTO_SECRET_KEY || 'SUPPLY_CHAIN_CONSORTIUM_SECRET_DEFAULT',
    },
    storage: {
        sqliteDbPath: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '..', 'offchain-data.db'),
    },
    fabric: {
        connectionProfilePath: process.env.FABRIC_CCP_PATH || path.resolve(__dirname, '..', '..', '..', 'private-layer', 'connection-org1.json'),
        walletPath: process.env.FABRIC_WALLET_PATH || path.resolve(__dirname, '..', 'wallet'),
        appIdentity: process.env.FABRIC_APP_IDENTITY || 'appUser',
        channelName: process.env.FABRIC_CHANNEL_NAME || 'supplychainchannel',
        chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'supplychain',
    }
};
