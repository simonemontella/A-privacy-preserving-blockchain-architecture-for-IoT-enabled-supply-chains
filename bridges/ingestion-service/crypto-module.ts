import crypto from 'crypto';
import { config } from './config';

const SECRET_KEY = crypto.createHash('sha256').update(config.crypto.secretKey).digest();
const ALGO = 'aes-256-cbc';

//TODO richiamarlo crypto-manager.ts

export interface EncryptedData {
    iv: string;
    encryptedPayload: string;
}

export function encryptPayload(payload: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, SECRET_KEY, iv);

    let encrypted = cipher.update(payload, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        iv: iv.toString('hex'),
        encryptedPayload: encrypted
    };
}

export function decryptPayload(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
        ALGO,
        SECRET_KEY,
        Buffer.from(encryptedData.iv, 'hex')
    );

    let decrypted = decipher.update(encryptedData.encryptedPayload, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export function computeCommitment(payload: string): string {
    return crypto.createHash('sha256').update(payload).digest('hex');
}
