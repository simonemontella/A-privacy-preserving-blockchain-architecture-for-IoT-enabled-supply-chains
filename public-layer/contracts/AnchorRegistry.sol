// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol";

/**
 * @title AnchorRegistry
 * @notice Registro pubblico per le prove di conformità dei lotti IoT.
 * @dev Verifica la prova Groth16 on-chain tramite il Verifier auto-generato da snarkjs,
 *      poi salva i risultati di compliance nel registro.
 *
 *      Public signals dal circuito (in ordine):
 *        [0] = p1Compliant  (1 = conforme, 0 = violazione)
 *        [1] = p2Compliant  (1 = conforme, 0 = violazione)
 *        [2] = maxTempThreshold
 *        [3] = maxTransportTime
 */
contract AnchorRegistry {
    
    Groth16Verifier public verifierContract;

    struct LotAnchor {
        bytes32 merkleRoot;
        bool p1Compliant;
        bool p2Compliant;
        uint256 anchoredAt;
    }

    mapping(string => LotAnchor) public lots;
    string[] public lotIds;

    event LotAnchored(
        string indexed lotId,
        bytes32 merkleRoot,
        bool p1Compliant,
        bool p2Compliant,
        uint256 timestamp
    );

    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifierContract = Groth16Verifier(_verifierAddress);
    }

    /**
     * @notice Registra un lotto verificando la prova ZK-SNARK Groth16 on-chain.
     * @param lotId Identificativo univoco del lotto
     * @param merkleRoot Radice dell'albero di Merkle degli eventi
     * @param pA Proof component A (2 elements)
     * @param pB Proof component B (2x2 elements)
     * @param pC Proof component C (2 elements)
     * @param pubSignals Segnali pubblici dal circuito [p1, p2, maxTemp, maxTime]
     */
    function anchorLot(
        string calldata lotId,
        bytes32 merkleRoot,
        uint[2] calldata pA,
        uint[2][2] calldata pB,
        uint[2] calldata pC,
        uint[4] calldata pubSignals
    ) external {
        require(bytes(lotId).length > 0, "Lot ID cannot be empty");
        require(lots[lotId].anchoredAt == 0, "Lot already anchored");

        // Verifica on-chain della prova Groth16 (tramite Verifier.sol auto-generato)
        bool isValidProof = verifierContract.verifyProof(pA, pB, pC, pubSignals);
        require(isValidProof, "ZK Proof verification failed");

        // Estrai i risultati di compliance dai public signals
        bool p1 = pubSignals[0] == 1;
        bool p2 = pubSignals[1] == 1;

        // Salva nel registro
        lots[lotId] = LotAnchor({
            merkleRoot: merkleRoot,
            p1Compliant: p1,
            p2Compliant: p2,
            anchoredAt: block.timestamp
        });

        lotIds.push(lotId);

        emit LotAnchored(lotId, merkleRoot, p1, p2, block.timestamp);
    }

    /**
     * @notice Verifica pubblica per i consumatori finali
     */
    function getLot(string calldata lotId) external view returns (bool exists, bool p1, bool p2, bytes32 root) {
        LotAnchor memory l = lots[lotId];
        exists = l.anchoredAt > 0;
        p1 = l.p1Compliant;
        p2 = l.p2Compliant;
        root = l.merkleRoot;
    }
}
