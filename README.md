# A privacy-preserving blockchain architecture for IoT-enabled supply chains

> A MSc thesis work in Computer Engineering focusing on blockchain and iot enabled supply chains, with an high attention on privacy preservation

## Objective

The main objective is to implement a privacy-preserving blockchain architecture for IoT-enabled supply chains which:

- guarantees transparency for consumers (end users),
- preserves business and operative privacy,
- is verifiable, predisposed to future process mining / anomaly detection implementations,
- allows analytics measures of some metrics like privacy/transparency trade-off, overhead, performances.

## Core components

1. Blockchain:
   - Private Consortium Blockchain
     Suppliers, Manufacturers, Producers, Distributors, Resellers can access writing/reading product/supply chain data based on their role
   - Public Consumer Blockchain
     Consumers can verify their product through a QR-Code/Barcode
2. Anchoring Service
   A middleware between private and public blockchains to anchor relative product/lots data
3. Ingestion Service
   A middleware between consortium participants and private blockchain.

## Tech Stack

TODO

## Privacy

Sensitive data to protect both from consumers and from other consortium participants who don't need those information:

- logistics data,
- partner, supplier information,
- temperature data and locations,
- secret business processes

## Data Model

We need to abstract a generic supply chain, for instance we'll take a generic cold chain identified by 4 steps:

1. CREATION
2. PROCESSING
3. TRANSPORT
4. RECEIVING

The main object to model will be the "LOT", a generic item - or group of items - involved in the supply chain.

## IoT

TODO

## Future works

1. process mining / anomaly detection
