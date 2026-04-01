import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
    server: {
        httpPort: process.env.ANCHOR_API_PORT ? parseInt(process.env.ANCHOR_API_PORT, 10) : 4000,
    },
    ethereum: {
        rpcUrl: process.env.ETH_RPC_URL || 'http://127.0.0.1:8545',
        privateKey: process.env.ETH_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        registryAddress: process.env.REGISTRY_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    },
    fabric: {
        connectionProfilePath: process.env.FABRIC_CCP_PATH || path.resolve(__dirname, '..', '..', 'private-layer', 'connection-org1.json'),
        walletPath: process.env.FABRIC_WALLET_PATH || path.resolve(__dirname, '..', '..', 'ingestion-service', 'wallet'),
        appIdentity: process.env.FABRIC_APP_IDENTITY || 'appUser',
        channelName: process.env.FABRIC_CHANNEL_NAME || 'supplychainchannel',
        chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'supplychain',
    },
    storage: {
        sqliteDbPath: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '..', '..', 'ingestion-service', 'offchain-data.db')
    }
};
