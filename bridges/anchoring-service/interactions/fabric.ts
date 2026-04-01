import { Contract, Gateway, Wallets } from 'fabric-network';
import fs from 'fs';
import { config } from '../config';

export let fabricContract: Contract;
export let gateway: Gateway;

export async function initFabric() {
    console.log("==> Bootstrapping Fabric Connection...");
    
    if (fs.existsSync(config.fabric.connectionProfilePath)) {
        const ccp = JSON.parse(fs.readFileSync(config.fabric.connectionProfilePath, 'utf8'));
        const fsWallet = await Wallets.newFileSystemWallet(config.fabric.walletPath);

        const identity = await fsWallet.get(config.fabric.appIdentity);
        if (identity) {
            gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet: fsWallet,
                identity: config.fabric.appIdentity,
                discovery: { enabled: true, asLocalhost: true }
            });
            const network = await gateway.getNetwork(config.fabric.channelName);
            fabricContract = network.getContract(config.fabric.chaincodeName);
            console.log("✅ Attached to Fabric Network");
        } else {
            throw new Error(`Identity ${config.fabric.appIdentity} not found in wallet. Please run enrollUser first.`);
        }
    } else {
        throw new Error(`Fabric Connection profile missing at path: ${config.fabric.connectionProfilePath}`);
    }
}

export async function fetchLotEvents(lotId: string): Promise<any[]> {
    if (!fabricContract) {
        throw new Error("Fabric contract not initialized.");
    }
    const result = await fabricContract.evaluateTransaction('GetEvents', lotId);
    return JSON.parse(result.toString());
}

export async function disconnectFabric() {
    if (gateway) {
        gateway.disconnect();
    }
}
