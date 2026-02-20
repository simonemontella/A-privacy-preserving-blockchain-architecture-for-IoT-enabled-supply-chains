import sqlite3 from "sqlite3";
import { config } from "./config";
import { StoredPayload } from "./types";

const db = new sqlite3.Database(config.offChain.dbPath);

export function initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(
                `
        CREATE TABLE IF NOT EXISTS payloads (
          id TEXT PRIMARY KEY,
          lotId TEXT NOT NULL,
          payloadRef TEXT NOT NULL,
          encryptedData TEXT NOT NULL,
          iv TEXT NOT NULL,
          authTag TEXT NOT NULL,
          commitment TEXT NOT NULL,
          timestamp TEXT NOT NULL
        )
      `,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    });
}

export function storePayload(payload: StoredPayload): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(
            `
      INSERT INTO payloads (id, lotId, payloadRef, encryptedData, iv, authTag, commitment, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
            [
                payload.id,
                payload.lotId,
                payload.payloadRef,
                payload.encryptedData,
                payload.iv,
                payload.authTag,
                payload.commitment,
                payload.timestamp,
            ],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

export function getPayload(payloadRef: string): Promise<StoredPayload | null> {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM payloads WHERE payloadRef = ?`,
            [payloadRef],
            (err, row) => {
                if (err) reject(err);
                else resolve((row as StoredPayload) || null);
            }
        );
    });
}

export function getLotPayloads(lotId: string): Promise<StoredPayload[]> {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM payloads WHERE lotId = ? ORDER BY timestamp ASC`,
            [lotId],
            (err, rows) => {
                if (err) reject(err);
                else resolve((rows as StoredPayload[]) || []);
            }
        );
    });
}

export function closeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
