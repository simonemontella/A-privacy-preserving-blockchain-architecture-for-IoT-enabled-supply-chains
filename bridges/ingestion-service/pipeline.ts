import crypto from 'crypto';
import { encryptPayload, computeCommitment } from './crypto-module';
import { saveToOffchainStorage } from './storage/storage-module';
import { registerEvent } from './storage/fabric-module';

export async function handleData(lotId: string, eventType: string, payloadData: any) {
    console.log(`--- New Data for Lot: ${lotId} [${eventType}] ---`);

    const rawString = JSON.stringify(payloadData);

    const encryptedData = encryptPayload(rawString);
    const payloadRef = crypto.randomUUID();

    await saveToOffchainStorage({
        payloadRef,
        iv: encryptedData.iv,
        encryptedPayload: encryptedData.encryptedPayload
    });

    console.log(`[Tier 1] Payload encrypted & saved to DB. Ref: ${payloadRef}`);

    const commitment = computeCommitment(rawString);

    const txId = await registerEvent(lotId, eventType, payloadRef, commitment);
    console.log(`[Tier 2] Event committed to Fabric Ledger. TxID/EventHash: ${txId}\n`);

    return { payloadRef, commitment, txId };
}

export async function handleCreateLot(lotId: string) {
    console.log(`--- Request to Create New Lot: ${lotId} ---`);
    const { createLot } = require('./storage/fabric-module');
    const txId = await createLot(lotId);
    console.log(`[Tier 2] Lot ${lotId} successfully created on Fabric. TxID: ${txId}\n`);
    return txId;
}
