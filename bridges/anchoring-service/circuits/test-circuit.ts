/**
 * test-circuit.ts
 * ===============
 * Standalone test script for the compliance ZK circuit.
 * Tests both compliant and non-compliant scenarios.
 * 
 * Usage:  npx ts-node circuits/test-circuit.ts
 * 
 * Prerequisites:
 *   1. Run build-circuit.sh first to generate wasm + zkey
 *   2. npm install snarkjs
 */

import * as snarkjs from 'snarkjs';
import * as path from 'path';
import * as fs from 'fs';

const N_MAX = 32;
const BUILD_DIR = path.resolve(__dirname, 'build');
const WASM_PATH = path.resolve(BUILD_DIR, 'compliance_js', 'compliance.wasm');
const ZKEY_PATH = path.resolve(BUILD_DIR, 'compliance_final.zkey');
const VKEY_PATH = path.resolve(BUILD_DIR, 'compliance.vkey.json');

function padArray(arr: number[], maxLen: number): number[] {
    const padded = [...arr];
    while (padded.length < maxLen) padded.push(0);
    return padded.slice(0, maxLen);
}

interface TestCase {
    name: string;
    temperatures: number[];
    transportTimes: number[];
    maxTemp: number;
    maxTime: number;
    expectedP1: boolean;
    expectedP2: boolean;
}

const TEST_CASES: TestCase[] = [
    {
        name: "✅ All Compliant — temperatures and times within limits",
        temperatures: [2, 3, 1, 4],
        transportTimes: [5, 7, 3],
        maxTemp: 4,
        maxTime: 8,
        expectedP1: true,
        expectedP2: true
    },
    {
        name: "❌ P1 Fail — one temperature exceeds threshold",
        temperatures: [2, 5, 1, 3],   // 5 > 4 → P1 fails
        transportTimes: [5, 7, 3],
        maxTemp: 4,
        maxTime: 8,
        expectedP1: false,
        expectedP2: true
    },
    {
        name: "❌ P2 Fail — one transport time exceeds SLA",
        temperatures: [2, 3, 1],
        transportTimes: [5, 10, 3],    // 10 > 8 → P2 fails
        maxTemp: 4,
        maxTime: 8,
        expectedP1: true,
        expectedP2: false
    },
    {
        name: "❌ Both Fail — violations in temperature and time",
        temperatures: [2, 6, 1],       // 6 > 4 → P1 fails
        transportTimes: [5, 9, 3],     // 9 > 8 → P2 fails
        maxTemp: 4,
        maxTime: 8,
        expectedP1: false,
        expectedP2: false
    },
    {
        name: "✅ Edge case — values exactly at threshold",
        temperatures: [4, 4, 4],       // 4 <= 4 → P1 ok
        transportTimes: [8, 8],        // 8 <= 8 → P2 ok
        maxTemp: 4,
        maxTime: 8,
        expectedP1: true,
        expectedP2: true
    },
    {
        name: "✅ Single reading — minimal data",
        temperatures: [3],
        transportTimes: [6],
        maxTemp: 4,
        maxTime: 8,
        expectedP1: true,
        expectedP2: true
    }
];

async function runTest(tc: TestCase, index: number): Promise<boolean> {
    console.log(`\n━━━ Test ${index + 1}: ${tc.name} ━━━`);
    console.log(`  Temps: [${tc.temperatures}] (max: ${tc.maxTemp})`);
    console.log(`  Times: [${tc.transportTimes}] (max: ${tc.maxTime})`);

    const input = {
        maxTempThreshold: tc.maxTemp,
        maxTransportTime: tc.maxTime,
        temperatures: padArray(tc.temperatures, N_MAX),
        transportTimes: padArray(tc.transportTimes, N_MAX),
        nTemps: tc.temperatures.length,
        nTimes: tc.transportTimes.length,
    };

    try {
        // 1. Generate proof
        const startTime = Date.now();
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);
        const proveTime = Date.now() - startTime;

        const p1 = publicSignals[0] === '1';
        const p2 = publicSignals[1] === '1';

        console.log(`  Result: P1=${p1}, P2=${p2}  (proof generated in ${proveTime}ms)`);

        // 2. Verify proof off-chain
        const vKey = JSON.parse(fs.readFileSync(VKEY_PATH, 'utf-8'));
        const verifyStart = Date.now();
        const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        const verifyTime = Date.now() - verifyStart;

        console.log(`  Proof valid: ${isValid}  (verified in ${verifyTime}ms)`);

        // 3. Assert
        let passed = true;
        if (p1 !== tc.expectedP1) {
            console.log(`  ❌ FAIL: P1 expected ${tc.expectedP1}, got ${p1}`);
            passed = false;
        }
        if (p2 !== tc.expectedP2) {
            console.log(`  ❌ FAIL: P2 expected ${tc.expectedP2}, got ${p2}`);
            passed = false;
        }
        if (!isValid) {
            console.log(`  ❌ FAIL: Proof verification failed!`);
            passed = false;
        }

        if (passed) {
            console.log(`  ✅ PASSED`);
        }
        return passed;

    } catch (error) {
        console.error(`  ❌ ERROR:`, error);
        return false;
    }
}

async function main() {
    console.log("════════════════════════════════════════");
    console.log("  ZK Circuit Test Suite");
    console.log("════════════════════════════════════════");

    // Check that build artifacts exist
    if (!fs.existsSync(WASM_PATH)) {
        console.error(`\n❌ WASM file not found at: ${WASM_PATH}`);
        console.error(`   Run build-circuit.sh first!`);
        process.exit(1);
    }
    if (!fs.existsSync(ZKEY_PATH)) {
        console.error(`\n❌ ZKEY file not found at: ${ZKEY_PATH}`);
        console.error(`   Run build-circuit.sh first!`);
        process.exit(1);
    }

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < TEST_CASES.length; i++) {
        const ok = await runTest(TEST_CASES[i], i);
        if (ok) passed++;
        else failed++;
    }

    console.log("\n════════════════════════════════════════");
    console.log(`  Results: ${passed} passed, ${failed} failed (${TEST_CASES.length} total)`);
    console.log("════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
}

main();
