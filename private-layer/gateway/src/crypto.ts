import crypto from "crypto";
import { config } from "./config";

export function calculateCommitment(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function encryptPayload(
  data: string
): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const key = Buffer.from(config.encryption.encryptionKey, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(config.encryption.algorithm, key, iv) as crypto.CipherGCM;
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptPayload(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  const key = Buffer.from(config.encryption.encryptionKey, "hex");
  const decipher = crypto.createDecipheriv(
    config.encryption.algorithm,
    key,
    Buffer.from(iv, "hex")
  ) as crypto.DecipherGCM;

  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
