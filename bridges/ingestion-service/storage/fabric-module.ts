import { Gateway, Wallets, Network, Contract } from 'fabric-network';
import * as fs from 'fs';
import { config } from '../config';

let contract: Contract | null = null;
let gateway: Gateway | null = null;

export async function initFabricConnection() {
    console.log('Initializing connection to Fabric network (Tier 2)...');
    try {
        const ccpPath = config.fabric.connectionProfilePath;

        let ccp: any;
        if (fs.existsSync(ccpPath)) {
            ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        } else {
            throw new Error(`Connection profile not found at path: ${ccpPath}`);
        }

        const walletPath = config.fabric.walletPath;
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(config.fabric.appIdentity);
        if (!identity) {
            throw new Error(`Identity ${config.fabric.appIdentity} not found in wallet. Please run enrollUser script first.`);
        }

        gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: config.fabric.appIdentity,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network: Network = await gateway.getNetwork(config.fabric.channelName);

        contract = network.getContract(config.fabric.chaincodeName);
        console.log(`✅ Successfully connected to Fabric ${config.fabric.channelName}`);

    } catch (error) {
        console.error(`Error connecting to Fabric: ${error}`);
    }
}

export async function registerEvent(lotId: string, eventType: string, payloadRef: string, commitment: string): Promise<string> {
    if (!contract) {
        throw new Error("Fabric contract is not initialized. Cannot register event.");
    }

    try {
        const result = await contract.submitTransaction('LogEvent', lotId, eventType, payloadRef, commitment);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`Failed to submit transaction to Fabric: ${error}`);
        throw error;
    }
}

export async function createLot(lotId: string): Promise<string> {
    if (!contract) {
        throw new Error("Fabric contract is not initialized. Cannot create lot.");
    }

    try {
        const result = await contract.submitTransaction('CreateLot', lotId);
        console.log(`CreateLot transaction evaluated, result is: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`Failed to submit CreateLot transaction to Fabric: ${error}`);
        throw error;
    }
}

export function disconnectFabric() {
    if (gateway) {
        gateway.disconnect();
    }
}
