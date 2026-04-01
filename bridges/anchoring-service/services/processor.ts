import { fetchLotEvents } from '../interactions/fabric';
import { submitAnchorTx } from '../interactions/eth';
import { fetchPayloadOffchain } from '../interactions/offchain';
import { buildMerkleTree } from '../crypto/merkle';
import { generateZKP, ZKPPayload } from '../crypto/zkp';

export async function processLot(lotId: string) {
    console.log(`\n--- [ANCHOR JOB] Processing Lot: ${lotId} ---`);

    // 1. Fetch Events from Fabric
    const events = await fetchLotEvents(lotId);
    if (!events || events.length === 0) {
        throw new Error(`No events found on Fabric for LotID: ${lotId}`);
    }

    // 2. Extract EventHashes & build Merkle Root
    const eventHashes = events.map((e: any) => e.EventHash);
    const merkleRoot = buildMerkleTree(eventHashes);
    const hexRoot = "0x" + merkleRoot;
    console.log(`Computed Merkle Root: ${hexRoot}`);

    // 3. Process the actual payload metrics to form the Zero Knowledge Inputs
    const zkpPayload: ZKPPayload = {
        privateInputs: { temperatures: [], transportTimes: [] },
        publicInputs: { maxTempThreshold: 4, maxTransportTime: 8 } 
    };

    for (const ev of events) {
        if (!ev.PayloadRef) continue;

        try {
            const clearDataStr = await fetchPayloadOffchain(ev.PayloadRef);
            const dataObj = JSON.parse(clearDataStr);
            if (dataObj.temperature) zkpPayload.privateInputs.temperatures.push(dataObj.temperature);
            if (dataObj.transitTimeHours) zkpPayload.privateInputs.transportTimes.push(dataObj.transitTimeHours);
        } catch (e) {
            console.error(`Failed to offchain fetch for ref: ${ev.PayloadRef}`, e);
        }
    }

    // 4. Generate real Groth16 ZK Proof via snarkjs
    const zkResult = await generateZKP(zkpPayload);
    console.log(`ZK Proof Result — P1:${zkResult.p1Compliant} | P2:${zkResult.p2Compliant}`);

    // 5. Submit the proof to Ethereum (Tier 3)
    try {
        await submitAnchorTx(
            lotId,
            hexRoot,
            zkResult.proof.pA,
            zkResult.proof.pB,
            zkResult.proof.pC,
            zkResult.publicSignals
        );
    } catch (e) {
        console.error("Failed Ethereum Transaction:", e);
    }
}
