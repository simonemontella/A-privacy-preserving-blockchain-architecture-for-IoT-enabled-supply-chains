---
description: Global context and coding standards for the Privacy-Preserving IoT Blockchain Thesis
applyTo: "**/*"
---

# AI ROLE

You are an expert Full-Stack Blockchain, IoT & Backend Engineer, ZK-Cryptographer, Senior Researcher. Your goal is to assist in the implementation of a Master Thesis project: "A privacy-preserving blockchain architecture for IoT enabled supply chains".
The main objective is to implement an MVP, with simple features, produce some measures and write the thesis documents (articles/papers).

## Thesis Title

**A privacy-preserving blockchain architecture for IoT enabled supply chains**

---

# 1. System Overview

This project implements an MVP architecture designed to:

- Log process-aware supply chain events in a private blockchain
- Preserve business-sensitive data
- Use Zero-Knowledge proofs to demonstrate compliance
- Allow consumers to verify product validity publicly
- Enable experimental evaluation (performance, cost, privacy/transparency trade-offs)

The architecture follows a **two-layer blockchain model**:

1. **Private Consortium Blockchain (Hyperledger Fabric)**
2. **Public Verification Blockchain (Ethereum Devnet)**

Bridging services connect the two layers and external world to them.

---

# 2. High-Level Architecture

## Components

### 1️⃣ Private Blockchain Layer (Hyperledger Fabric)

- Permissioned consortium network
- Logs process-aware events
- Structured event records per `lot_id`
- Does NOT expose sensitive raw data

It will be assisted by an off-chain storage.

### 2️⃣ Public Blockchain Layer (Ethereum Devnet)

- Stores one anchor per lot
- Verifies Zero-Knowledge proofs on-chain
- Publicly exposes compliance results
- No raw IoT data or business secrets

### 3️⃣ Ingestion Service

- Receives IoT events via MQTT or any other source
- Encrypts raw payload off-chain
- Computes event commitments and hashes
- Submits events to Fabric

### 4️⃣ Anchoring / ZK Service

Triggered when a lot reaches `COMPLETED`.

It:

- Retrieves all events for a given `lot_id`
- Builds a Merkle tree over event hashes
- Computes compliance properties P1 (range condition) e P2 (time constraint)
- Generates a batch-level ZK proof
- Anchors root + proof to Ethereum

### 5️⃣ Consumer or Inspection Verification Layer

- CLI or minimal web interface
- Input: `lot_ref` (QR code)
- Reads Ethereum contract
- Displays compliance result

---

# 3. Generic Supply Chain Model

This architecture is domain-agnostic and can be applied to multiple supply chains,
including but not limited to:

- Agri-food products (e.g., fresh dairy, meat, fish)
- Pharmaceutical products
- Biomedical logistics (e.g., organ transport for transplantation)
- Cold-chain sensitive goods

The system models a generic controlled supply chain where a sensitive asset
(e.g., food product, medicine, organ, biological sample) must comply with
environmental and temporal constraints.
For instance we'll use a generic cold-chain.

---

## 3.1 Asset Definition

The system tracks a single identifiable asset: lot_id

The term "lot" is used generically to represent:

- A production batch
- A shipment
- A biological sample
- A donated organ
- Any tracked supply-chain unit

The architecture is not limited to agricultural products.

---

## 3.2 Supply Chain Stages (Abstract Model)

The system supports the following abstract stages:

1. **Origin**
   - Asset creation, harvesting, donation, or initial production.

2. **Processing**
   - Transformation, validation, packaging, preparation, or medical handling.

3. **Transportation**
   - Movement between facilities.
   - May involve multiple segments.

4. **Delivery / Final Reception**
   - Arrival at final destination (retail point, hospital, consumer, etc.)
   - This stage triggers anchoring and compliance verification.

---

## 3.3 Generic Actor Roles

Actors are modeled generically:

- ORIGIN_OPERATOR
- PROCESS_OPERATOR
- TRANSPORT_OPERATOR
- RECEIVING_OPERATOR
- CONSUMER / FINAL_VERIFIER (read-only)

---

## 3.4 Compliance Model (Domain-Agnostic)

The system verifies two fundamental compliance properties
that apply across multiple domains:

### P1 — Environmental Constraint

An environmental parameter must remain within a threshold: max(measured_value) ≤ threshold
Examples:

- Temperature ≤ 4°C (cold chain)
- Temperature ≤ 8°C (organ transport)
- Humidity ≤ X%
- Pressure within safe range

### P2 — Temporal Constraint

A time-sensitive operation must respect a maximum duration: max(transit_time) ≤ SLA_max
Examples:

- Transport duration ≤ 8 hours
- Organ ischemic time ≤ medical threshold
- Pharmaceutical distribution time ≤ regulation limit

Transit time is computed from: TRANSPORT_START → TRANSPORT_END

Only complete start/end pairs are considered.

---

## 3.5 Domain Flexibility

The architecture does not encode domain-specific logic in the blockchain layer.

Instead:

- Threshold values are configurable.
- Stage semantics are abstract.
- Compliance logic is expressed generically in ZK circuits.

This makes the system adaptable to:

- Food safety validation
- Pharmaceutical cold chain monitoring
- Biomedical asset transport (e.g., organs)
- Any high-integrity supply chain requiring privacy-preserving transparency
