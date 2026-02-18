# Architecture

> Minimal working scheme — enough to reason about the system before writing code.

---

## Panoramic

```mermaid
graph LR
    IoT["🌡️ IoT Sensors"]
    IS["Ingestion<br/>Service"]
    FL["Hyperledger Fabric<br/>(Private Ledger)"]
    OC["Off-Chain Store<br/>(Encrypted)"]
    AS["Anchoring<br/>Service"]
    ETH["Ethereum<br/>(Public Verifier)"]
    C["📱 Consumer"]

    IoT -->|MQTT| IS
    IS -->|event record| FL
    IS -->|encrypted payload| OC
    FL -->|batch query| AS
    AS -->|Merkle root + ZK proof| ETH
    C -->|verify lot| ETH
```

**What goes where:**

| Layer     | Stores                                                               | Visible to                         |
| --------- | -------------------------------------------------------------------- | ---------------------------------- |
| Off-Chain | Raw sensor data (encrypted)                                          | Authorized consortium members only |
| Fabric    | `event_hash`, `lot_id`, `event_type`, `timestamp`, `prev_event_hash` | Consortium (role-based)            |
| Ethereum  | `batch_root`, `zk_proof`, `public_inputs` (thresholds)               | Everyone                           |

---

## 2. Data Flow

The lifecycle of a single IoT event, from sensor to consumer verification:

```mermaid
sequenceDiagram
    participant S as 🌡️ Sensor
    participant I as Ingestion Service
    participant F as Fabric
    participant O as Off-Chain
    participant A as Anchoring Service
    participant E as Ethereum
    participant C as 📱 Consumer

    S->>I: telemetry (temp, GPS, ts)
    par
        I->>O: encrypt & store raw payload
        I->>F: write (event_hash, lot_id,<br/>event_type, ts, prev_event_hash)
    end

    Note over F: Events are chained per lot<br/>via prev_event_hash

    A->>F: get all events for lot_id
    A->>A: build Merkle tree + generate ZK proof
    A->>E: anchor(batch_root, proof, public_inputs)

    C->>E: verify(lot_id)
    E-->>C: ✅ compliant / ❌ failed
```

---

## 3. Privacy Model — Three Tiers

We deliberately split data across three isolation boundaries. The core idea: every layer downstream sees strictly _less_ than the one above it.

```mermaid
graph TD
    T1["<b>Tier 1 — Off-Chain</b><br/>Raw values, partner IDs,<br/>GPS coords, business logic"]
    T2["<b>Tier 2 — Private Chain</b><br/>Hashes, lot IDs, types,<br/>timestamps, event links"]
    T3["<b>Tier 3 — Public Chain</b><br/>Merkle root, ZK proof,<br/>threshold values only"]

    T1 -->|"hash(payload)"| T2
    T2 -->|"merkle(batch) + ZKP"| T3

    T1 -.- A1["🏭 Consortium<br/>(role-gated)"]
    T3 -.- A2["📱 Consumer<br/>(read-only)"]
```

Why this matters: a consumer can verify that a cold-chain product stayed within temperature limits, but they'll never learn the exact readings, who the suppliers were, or which route the truck took.

---

## 4. Process-Awareness

Every event for a given `lot_id` carries a `prev_event_hash`, forming an append-only chain. This is what makes the system _process-aware_ — we don't just log events, we preserve their order and integrity.

```mermaid
graph LR
    E1["ORIGIN<br/>prev: ∅"]
    E2["PROCESS<br/>prev: hash(E1)"]
    E3["TRANSPORT_START<br/>prev: hash(E2)"]
    E4["TRANSPORT_END<br/>prev: hash(E3)"]
    E5["DELIVERY<br/>prev: hash(E4)"]

    E1 --> E2 --> E3 --> E4 --> E5
```

When a lot reaches its final stage (DELIVERY), the Anchoring Service triggers: it collects all events, builds a Merkle tree, generates a ZK proof, and anchors everything to Ethereum.

---

## 5. Compliance Properties

We verify two properties in the ZK proof — both configurable, both domain-agnostic:

| Property               | What it checks                                     | Formula                       | Example         |
| ---------------------- | -------------------------------------------------- | ----------------------------- | --------------- |
| **P1** — Environmental | A measured value stays within a threshold          | `max(value) ≤ threshold`      | All temps ≤ 4°C |
| **P2** — Temporal      | A time-sensitive operation completes within an SLA | `max(transit_time) ≤ SLA_max` | Transport ≤ 8h  |

**P2** is computed from `TRANSPORT_START → TRANSPORT_END` pairs. Only complete pairs count.

The ZK circuit proves these properties over the batch **without revealing the actual values** — the public inputs are just the thresholds, and the proof attests that the private data satisfies them.

---

## 6. Repo Layout

```
progetto/
├── private-layer/          # Fabric network + Go chaincode
├── public-layer/           # Ethereum contracts (Solidity)
├── bridges/
│   ├── ingestion-service/  # IoT → Fabric (Node.js/TS)
│   └── anchoring-service/  # Fabric → ZK → Ethereum (Node.js/TS)
├── architecture.md         # ← this file
└── README.md
```
