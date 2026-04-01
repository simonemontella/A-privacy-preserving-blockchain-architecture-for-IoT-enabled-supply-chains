import sqlite3 from 'sqlite3';
import { config } from '../config';
import { decryptPayload, EncryptedData } from '../../ingestion-service/crypto-module';

// Initialize the DB object connecting to the SQLite file
export const db = new sqlite3.Database(config.storage.sqliteDbPath, (err) => {
    if (err) {
        console.error('Error opening SQLite database in Anchoring Service:', err.message);
    } else {
        console.log(`✅ Connected to SQLite database at ${config.storage.sqliteDbPath}`);
    }
});

/**
 * Retrieves ciphertext from SQLite and calls the shared decryption function
 */
export function fetchPayloadOffchain(payloadRef: string): Promise<string> {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM offchain_payloads WHERE payloadRef = ?`, [payloadRef], (err, row: any) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('Payload not found off-chain'));

            const encryptedData: EncryptedData = {
                iv: row.iv,
                encryptedPayload: row.encryptedPayload
            };

            const clearText = decryptPayload(encryptedData);
            resolve(clearText);
        });
    });
}
