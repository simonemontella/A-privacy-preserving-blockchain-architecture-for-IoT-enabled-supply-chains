import mqtt, { MqttClient } from "mqtt";
import { config } from "./config";
import { IoTEvent } from "./types";

let mqttClient: MqttClient | null = null;

export function initMqtt(eventHandler: (event: IoTEvent) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
        mqttClient = mqtt.connect(config.mqtt.broker);

        mqttClient.on("connect", () => {
            console.log("Connected to MQTT broker");
            mqttClient!.subscribe(config.mqtt.topic, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        mqttClient.on("message", async (topic, message) => {
            try {
                const data = JSON.parse(message.toString()) as IoTEvent;
                await eventHandler(data);
            } catch (err) {
                console.error("Error processing MQTT message:", err);
            }
        });

        mqttClient.on("error", reject);
    });
}

export async function closeMqtt(): Promise<void> {
    if (mqttClient) {
        return new Promise((resolve) => {
            mqttClient!.end(() => resolve());
        });
    }
}
