import * as fs from "fs";
import * as path from "path";
import { createPrivateKey } from "crypto";
import {
    connect,
    Contract,
    Gateway,
    Network,
    signers,
} from "@hyperledger/fabric-gateway";
import * as grpc from "@grpc/grpc-js";
import { config } from "./config";

let gateway: Gateway | null = null;
let contract: Contract | null = null;

export async function initFabricGateway(): Promise<void> {
    const connectionProfile = JSON.parse(
        fs.readFileSync(config.fabric.connectionProfile, "utf8")
    );

    const certPath = config.fabric.certificatePath;
    const keyPath = config.fabric.privateKeyPath;

    const cert = fs.readFileSync(certPath, "utf8");
    const key = fs.readFileSync(keyPath, "utf8");

    const credentials = {
        certificate: cert,
        privateKey: key,
    };

    const tlsCertPath = path.join(
        path.dirname(certPath),
        "../tlscacerts/tlsca.crt"
    );
    const tlsCert = fs.readFileSync(tlsCertPath, "utf8");

    const tlsCredentials = grpc.credentials.createSsl(Buffer.from(tlsCert));

    const privateKeyObject = createPrivateKey(key);

    gateway = connect({
        identity: { mspId: config.fabric.mspId, credentials },
        signer: signers.newPrivateKeySigner(privateKeyObject),
        tlsCredentials,
    } as any);

    const network: Network = gateway.getNetwork(config.fabric.channelName);
    contract = network.getContract(config.fabric.chaincodeName);
}

export async function createLot(lotId: string): Promise<void> {
    if (!contract) throw new Error("Fabric gateway not initialized");
    await contract.submitTransaction("CreateLot", lotId);
}

export async function logEvent(
    lotId: string,
    eventType: string,
    payloadRef: string,
    commitment: string
): Promise<string> {
    if (!contract) throw new Error("Fabric gateway not initialized");
    const result = await contract.submitTransaction(
        "LogEvent",
        lotId,
        eventType,
        payloadRef,
        commitment
    );
    return result.toString();
}

export async function closeFabricGateway(): Promise<void> {
    if (gateway) {
        await gateway.close();
    }
}
