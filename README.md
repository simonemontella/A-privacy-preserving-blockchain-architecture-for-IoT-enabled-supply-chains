# Privacy-Preserving Blockchain Architecture for IoT-Enabled Supply Chains

## Overview

Modern supply chains demand robust tools to certify product origin, quality, and compliance throughout their lifecycle. While the integration of Internet of Things (IoT) and Blockchain technologies enables granular, real-time data collection and immutable recording, it introduces a natural paradox between **public transparency** and **industrial confidentiality**. End-to-end visibility exposes sensitive operational data—such as field measurements, partner identities, and production volumes—to unauthorized actors or competitors. Furthermore, high-frequency IoT data streams severely limit scalability, making direct on-chain recording unsustainable.

This repository contains the prototype implementation of a **hybrid, multi-layer, privacy-preserving blockchain architecture** designed to solve these challenges.

The system natively interacts with generic IoT data collection infrastructures, combining three distinct layers:

1. **Encrypted Off-chain Storage**: Privately archives raw IoT sensor payloads.
2. **Private Ledger (Hyperledger Fabric)**: A permissioned registry shared among consortium partners to record activities executed along the supply chain.
3. **Public Ledger (Ethereum)**: A permissionless blockchain enabling the public verifiability of lot compliance.

The interaction between these layers is orchestrated by specialized intermediary services. These services summarize the entire history of each lot into a cryptographic footprint using **Merkle Trees** and generate **Zero-Knowledge Proofs (ZK-SNARKs)**. This proves mathematical compliance with regulatory or contractual constraints without ever exposing the underlying sensitive data.

## Project Structure

The repository is modularly structured as follows:

- **`private-layer/`**: Contains the Hyperledger Fabric network configuration and the smart contracts (chaincode) deployed on the private ledger.
- **`public-layer/`**: Contains the Ethereum smart contracts (Solidity) for public anchoring and ZKP verification.
- **`bridges/`**: Contains the intermediary Node.js services connecting the layers.
  - **`ingestion-service/`**: Ingests IoT telemetry data (via HTTP/MQTT), encrypts the raw payloads for off-chain storage, and logs the event references to the Fabric ledger.
  - **`anchoring-service/`**: Aggregates lot events into Merkle Trees, generates Zero-Knowledge proofs of their validity, and anchors the roots and proofs to Ethereum.
- **`client-app/`** & **`dashboard/`**: Front-end user interfaces for interacting with the system and verifying lots.
- **`experiments/`**: Testing scripts, benchmark utilities, and experiment results evaluating system throughput, latency, and gas consumption.
