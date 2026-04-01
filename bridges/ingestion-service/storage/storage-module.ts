import sqlite3 from 'sqlite3';
import { config } from '../config';

export const db = new sqlite3.Database(config.storage.sqliteDbPath, (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err.message);
    } else {
        console.log(`Connected to the SQLite database at ${config.storage.sqliteDbPath}`);
        db.run(`
            CREATE TABLE IF NOT EXISTS offchain_payloads (
                payloadRef TEXT PRIMARY KEY,
                iv TEXT NOT NULL,
                encryptedPayload TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});

export interface StorageRecord {
    payloadRef: string;
    iv: string;
    encryptedPayload: string;
}

export function saveToOffchainStorage(record: StorageRecord): Promise<void> {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO offchain_payloads (payloadRef, iv, encryptedPayload) 
            VALUES (?, ?, ?)
        `;
        db.run(query, [record.payloadRef, record.iv, record.encryptedPayload], function (err) {
            if (err) {
                console.error('Failed to insert record into SQLite:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
