import express from 'express';
import { handleData } from '../pipeline';

export function setupHttpRoutes(app: express.Express) {
    // REST API DEFINITION //TODO: redefine name logEvent
    app.post('/iot', async (req, res) => {
        try {
            const { lotId, eventType, payload } = req.body;

            if (!lotId || !eventType || !payload) {
                return res.status(400).json({ error: 'Missing required fields: lotId, eventType, payload' });
            }

            const result = await handleData(lotId, eventType, payload);
            res.status(201).json({ success: true, ...result });
        } catch (error) {
            console.error('HTTP Handler error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    });

    app.post('/lot', async (req, res) => {
        try {
            const { lotId } = req.body;
            if (!lotId) {
                return res.status(400).json({ error: 'Missing required field: lotId' });
            }

            // This assumes we add a pipeline function to handle this
            const result = await require('../pipeline').handleCreateLot(lotId);
            res.status(201).json({ success: true, txId: result });
        } catch (error) {
            console.error('HTTP Lot Handler error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    });
}
