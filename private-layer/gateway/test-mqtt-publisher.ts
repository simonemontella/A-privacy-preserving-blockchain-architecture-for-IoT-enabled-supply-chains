import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883");

const eventTypes = ["ORIGIN", "PROCESSING", "TRANSPORTING", "COMPLETION"];
let eventIndex = 0;

client.on("connect", () => {
    console.log("Mock sensor connected");

    const interval = setInterval(() => {
        const lotId = `lot-${Math.floor(Math.random() * 1000)}`;
        const eventType = eventTypes[eventIndex % eventTypes.length];
        const value = 2 + Math.random() * 6;

        const event = {
            sensorId: "mock-sensor-001",
            lotId,
            timestamp: new Date().toISOString(),
            eventType,
            value,
            unit: "°C",
            metadata: {
                location: "facility-a",
            },
        };

        client.publish("sensors/warehouse/data", JSON.stringify(event), (err) => {
            if (err) console.error("Publish error:", err);
            else console.log(`Published event: ${eventType} for ${lotId}`);
        });

        eventIndex++;

        if (eventIndex > 20) {
            clearInterval(interval);
            client.end();
            process.exit(0);
        }
    }, 2000);
});

client.on("error", (err) => {
    console.error("MQTT error:", err);
    process.exit(1);
});
