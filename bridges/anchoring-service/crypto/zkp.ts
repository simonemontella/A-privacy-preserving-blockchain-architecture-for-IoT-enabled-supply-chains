import * as snarkjs from 'snarkjs';
import * as path from 'path';

// Maximum array size compiled into the circuit (must match compliance.circom)
const N_MAX = 32;

// Paths to the compiled circuit artifacts
const CIRCUITS_BUILD_DIR = path.resolve(__dirname, '..', 'circuits', 'build');
const WASM_PATH = path.resolve(CIRCUITS_BUILD_DIR, 'compliance_js', 'compliance.wasm');
const ZKEY_PATH = path.resolve(CIRCUITS_BUILD_DIR, 'compliance_final.zkey');
const VKEY_PATH = path.resolve(CIRCUITS_BUILD_DIR, 'compliance.vkey.json');

/**
 * ZKP Input Payload — the bridge between application data and circuit inputs
 */
export interface ZKPPayload {
    privateInputs: {
        temperatures: number[];
        transportTimes: number[];
    };
    publicInputs: {
        maxTempThreshold: number;
        maxTransportTime: number;
    };
}

/**
 * Groth16 proof structure compatible with Ethereum's Verifier.sol
 */
export interface Groth16Proof {
    pA: [string, string];
    pB: [[string, string], [string, string]];
    pC: [string, string];
}

/**
 * Result of the ZKP generation
 */
export interface ZKPResult {
    proof: Groth16Proof;
    publicSignals: string[];
    p1Compliant: boolean;
    p2Compliant: boolean;
}

/**
 * Pads an array to N_MAX length with zeros.
 * Circom requires fixed-size arrays at compile time.
 */
function padArray(arr: number[], maxLen: number): number[] {
    const padded = [...arr];
    while (padded.length < maxLen) {
        padded.push(0);
    }
    return padded.slice(0, maxLen);
}

/**
 * Generates a real Groth16 ZK proof using snarkjs and the compiled Circom circuit.
 * 
 * The circuit proves:
 *   P1: all temperatures[i] ≤ maxTempThreshold   (for i < nTemps)
 *   P2: all transportTimes[i] ≤ maxTransportTime  (for i < nTimes)
 * 
 * without revealing the actual temperature/time values.
 */
export async function generateZKP(payload: ZKPPayload): Promise<ZKPResult> {
    const { privateInputs, publicInputs } = payload;

    // Build the circuit input object (must match signal names in compliance.circom)
    const circuitInput = {
        // Public inputs
        maxTempThreshold: publicInputs.maxTempThreshold,
        maxTransportTime: publicInputs.maxTransportTime,
        // Private inputs — padded to N_MAX
        temperatures:     padArray(privateInputs.temperatures, N_MAX),
        transportTimes:   padArray(privateInputs.transportTimes, N_MAX),
        nTemps:           privateInputs.temperatures.length,
        nTimes:           privateInputs.transportTimes.length,
    };

    console.log(`  [ZKP] Generating Groth16 proof (${privateInputs.temperatures.length} temps, ${privateInputs.transportTimes.length} times)...`);

    // Generate the actual proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        WASM_PATH,
        ZKEY_PATH
    );

    // The circuit outputs p1Compliant and p2Compliant as the FIRST two public signals.
    // Public signals order: [p1Compliant, p2Compliant, maxTempThreshold, maxTransportTime]
    const p1Compliant = publicSignals[0] === '1';
    const p2Compliant = publicSignals[1] === '1';

    console.log(`  [ZKP] Proof generated. P1=${p1Compliant}, P2=${p2Compliant}`);

    // Format the proof for Ethereum's Verifier.sol
    // snarkjs returns proof as a generic object with pi_a, pi_b, pi_c fields
    const p = proof as any;
    const formattedProof: Groth16Proof = {
        pA: [p.pi_a[0], p.pi_a[1]],
        pB: [
            [p.pi_b[0][1], p.pi_b[0][0]],  // Note: BN254 coord swap
            [p.pi_b[1][1], p.pi_b[1][0]]
        ],
        pC: [p.pi_c[0], p.pi_c[1]]
    };

    return {
        proof: formattedProof,
        publicSignals,
        p1Compliant,
        p2Compliant
    };
}

/**
 * Verifies a Groth16 proof off-chain using the verification key.
 * Useful for local testing before submitting to Ethereum.
 */
export async function verifyZKPOffchain(
    publicSignals: string[],
    proof: any
): Promise<boolean> {
    const vKey = require(VKEY_PATH);
    return snarkjs.groth16.verify(vKey, publicSignals, proof);
}
