export type EventType = "ORIGIN" | "PROCESSING" | "PROCESSED" | "TRANSPORTING" | "TRANSPORTED" | "COMPLETION" | "INSPECTION";

export interface IoTEvent {
  sensorId: string;
  lotId: string;
  timestamp: string;
  eventType: EventType;
  value: number;
  unit: string;
  metadata?: Record<string, unknown>;
}

export interface StoredPayload {
  id: string;
  lotId: string;
  payloadRef: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  commitment: string;
  timestamp: string;
}
