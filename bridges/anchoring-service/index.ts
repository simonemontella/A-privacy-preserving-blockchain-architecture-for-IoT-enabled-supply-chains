import express from 'express';
import { config } from './config';
import { initFabric, disconnectFabric } from './interactions/fabric';
import { initEthereum } from './interactions/eth';
import { processLot } from './services/processor';

// ==== DAEMON HTTP SERVER ====
const app = express();
app.use(express.json());

app.post('/anchor', async (req, res) => {
    try {
        const { lotId } = req.body;
        if (!lotId) return res.status(400).json({ error: "Missing lotId" });

        await processLot(lotId);
        res.status(200).json({ success: true, lotId, message: "Lot anchored to Ethereum successfully" });
    } catch (error: any) {
        console.error("Anchoring Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

async function main() {
    await initEthereum();
    await initFabric();

    app.listen(config.server.httpPort, () => {
        console.log(`✅ Anchoring Service Daemon listening on port ${config.server.httpPort}. Send POST /anchor { "lotId": "..." } to trigger.`);
    });

    // Keep node running
    process.on('SIGINT', () => {
        console.log("Shutting down anchoring service...");
        disconnectFabric();
        process.exit(0);
    });
}

main().catch(console.error);
