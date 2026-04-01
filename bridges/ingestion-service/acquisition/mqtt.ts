import mqtt from 'mqtt';
import { handleData } from '../pipeline';

export function setupMqttClient(mqttBrokerUrl: string) {
    const mqttClient = mqtt.connect(mqttBrokerUrl);

    mqttClient.on('connect', () => {
        console.log(`✅ Connected to MQTT Broker at ${mqttBrokerUrl}`);
        // Subscribe to topic pattern sc/lot/+/iot
        mqttClient.subscribe('sc/lot/+/iot', { qos: 1 }, (err) => {
            if (!err) {
                console.log('Subscribed to pattern: sc/lot/+/iot (QoS 1)');
            } else {
                console.error('Failed to subscribe to MQTT topic', err);
            }
        });
    });

    mqttClient.on('message', async (topic, message) => {
        // Expected topic: sc/lot/LOT123/iot
        try {
            const parts = topic.split('/');
            if (parts.length === 4 && parts[0] === 'sc' && parts[1] === 'lot' && parts[3] === 'iot') {
                const lotId = parts[2];

                // Assume MQTT payload structure is JSON with { eventType, ...data }
                const payloadObject = JSON.parse(message.toString());
                const eventType = payloadObject.eventType || 'TELEMETRY';

                // Strip eventType from payload to keep data pure before saving
                delete payloadObject.eventType;

                await handleData(lotId, eventType, payloadObject);
            }
        } catch (error) {
            console.error('MQTT Handler error:', error);
        }
    });

    return mqttClient;
}
