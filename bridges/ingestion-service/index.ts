import express from 'express';
import { config } from './config';
import { initFabricConnection } from './storage/fabric-module';
import { setupHttpRoutes } from './acquisition/http';
import { setupMqttClient } from './acquisition/mqtt';

const app = express();
app.use(express.json());

// Set up the HTTP REST endpoints
setupHttpRoutes(app);

// INITIALIZATION
async function startServer() {
    // 1. Connect to Tier 2 (Fabric)
    await initFabricConnection();

    // 2. Start HTTP Acquisition server
    app.listen(config.server.httpPort, () => {
        console.log(`✅ Ingestion Service HTTP REST API listening on port ${config.server.httpPort}`);
    });

    // 3. Start MQTT Acquisition client
    setupMqttClient(config.server.mqttBrokerUrl);
}

startServer().catch(console.error);
