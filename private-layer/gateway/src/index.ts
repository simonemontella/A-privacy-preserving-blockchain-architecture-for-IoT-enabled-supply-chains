import "dotenv/config";
import { initFabricGateway, createLot, logEvent, closeFabricGateway } from "./fabric-client";
import { initMqtt, closeMqtt } from "./mqtt-client";
import { initDatabase, storePayload, closeDatabase } from "./off-chain-store";
import { calculateCommitment, encryptPayload } from "./crypto";
import { IoTEvent } from "./types";
import crypto from "crypto";

const lots = new Set<string>();

async function processEvent(event: IoTEvent): Promise<void> {
    try {
        if (!lots.has(event.lotId)) {
            console.log(`Creating lot: ${event.lotId}`);
            await createLot(event.lotId);
            lots.add(event.lotId);
        }

        const payloadJson = JSON.stringify({
            sensorId: event.sensorId,
            timestamp: event.timestamp,
            value: event.value,
            unit: event.unit,
            metadata: event.metadata,
        });

        const commitment = calculateCommitment(payloadJson);
        const { encrypted, iv, authTag } = encryptPayload(payloadJson);

        const payloadRef = `${event.lotId}-${event.eventType}-${Date.now()}`;
        const payloadId = crypto.randomBytes(16).toString("hex");

        await storePayload({
            id: payloadId,
            lotId: event.lotId,
            payloadRef,
            encryptedData: encrypted,
            iv,
            authTag,
            commitment,
            timestamp: new Date().toISOString(),
        });

        console.log(`Logging event for lot ${event.lotId}: ${event.eventType}`);
        await logEvent(event.lotId, event.eventType, payloadRef, commitment);
    } catch (err) {
        console.error("Error processing event:", err);
    }
}

async function run(): Promise<void> {
    try {
        console.log("Initializing off-chain database...");
        await initDatabase();

        console.log("Initializing Fabric gateway...");
        await initFabricGateway();

        console.log("Connecting to MQTT broker...");
        await initMqtt(processEvent);

        console.log("Gateway running. Listening for IoT events...");
    } catch (err) {
        console.error("Fatal error:", err);
        process.exit(1);
    }
}

process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await closeMqtt();
    await closeFabricGateway();
    await closeDatabase();
    process.exit(0);
});

run();
