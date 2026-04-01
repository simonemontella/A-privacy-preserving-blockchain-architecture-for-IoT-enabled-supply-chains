#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════
#  Build Script — Circom Circuit Compilation & Groth16 Setup
# ═══════════════════════════════════════════════════════════
#
#  Prerequisites:
#    - circom installed (npm install -g circom  OR  build from source)
#    - snarkjs installed (npm install snarkjs)
#    - Node.js ≥ 18
#
#  This script:
#    1. Compiles the Circom circuit → .wasm + .r1cs
#    2. Downloads Powers of Tau (universal ceremony)
#    3. Runs Groth16 phase-2 setup → .zkey
#    4. Exports verification key → .vkey.json
#    5. Auto-generates Verifier.sol

CIRCUIT_NAME="compliance"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build"
PTAU_FILE="${BUILD_DIR}/pot14_final.ptau"

echo "════════════════════════════════════════"
echo "  ZK Circuit Build — ${CIRCUIT_NAME}"
echo "════════════════════════════════════════"

# ── Create build directory ──
mkdir -p "${BUILD_DIR}"

# ═══════════════════════════════════
#  Step 1: Compile the Circom circuit
# ═══════════════════════════════════
echo ""
echo "🔧 [1/5] Compiling Circom circuit..."
circom "${SCRIPT_DIR}/${CIRCUIT_NAME}.circom" \
    --r1cs \
    --wasm \
    --sym \
    -o "${BUILD_DIR}"

echo "   ✅ Generated: ${CIRCUIT_NAME}.r1cs, ${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"

# ═══════════════════════════════════
#  Step 2: Download Powers of Tau
# ═══════════════════════════════════
#  pot14 supports up to 2^14 = 16384 constraints (plenty for us).
#  We download from the Hermez trusted ceremony.
echo ""
echo "📥 [2/5] Downloading Powers of Tau (pot14)..."

if [ ! -f "${PTAU_FILE}" ]; then
    curl -L -o "${PTAU_FILE}" \
        "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau"
    echo "   ✅ Downloaded Powers of Tau"
else
    echo "   ⏭️  Powers of Tau already present, skipping download"
fi

# ═══════════════════════════════════
#  Step 3: Groth16 Phase-2 Setup
# ═══════════════════════════════════
echo ""
echo "🔑 [3/5] Running Groth16 setup (phase 2)..."

# Initialize zkey with the circuit R1CS + Powers of Tau
npx snarkjs groth16 setup \
    "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" \
    "${PTAU_FILE}" \
    "${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey"

# Contribute randomness (single contribution for development)
npx snarkjs zkey contribute \
    "${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey" \
    "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" \
    --name="dev-contribution" \
    -v -e="random-entropy-for-dev-$(date +%s)"

echo "   ✅ Generated: ${CIRCUIT_NAME}_final.zkey"

# ═══════════════════════════════════
#  Step 4: Export Verification Key
# ═══════════════════════════════════
echo ""
echo "🔓 [4/5] Exporting verification key..."

npx snarkjs zkey export verificationkey \
    "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" \
    "${BUILD_DIR}/${CIRCUIT_NAME}.vkey.json"

echo "   ✅ Generated: ${CIRCUIT_NAME}.vkey.json"

# ═══════════════════════════════════
#  Step 5: Generate Solidity Verifier
# ═══════════════════════════════════
echo ""
echo "📜 [5/5] Generating Solidity Verifier contract..."

npx snarkjs zkey export solidityverifier \
    "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" \
    "${BUILD_DIR}/Verifier.sol"

echo "   ✅ Generated: Verifier.sol"

# ── Summary ──
echo ""
echo "════════════════════════════════════════"
echo "  ✅ BUILD COMPLETE"
echo "════════════════════════════════════════"
echo ""
echo "  Build artifacts in: ${BUILD_DIR}/"
echo ""
echo "  Files produced:"
echo "    • ${CIRCUIT_NAME}.r1cs           (constraint system)"
echo "    • ${CIRCUIT_NAME}_js/*.wasm      (witness generator)"
echo "    • ${CIRCUIT_NAME}_final.zkey     (proving key)"
echo "    • ${CIRCUIT_NAME}.vkey.json      (verification key)"
echo "    • Verifier.sol                   (on-chain verifier)"
echo ""
echo "  Next steps:"
echo "    1. Copy Verifier.sol → public-layer/contracts/"
echo "    2. Run 'npx ts-node circuits/test-circuit.ts' to test"
echo "    3. Update AnchorRegistry.sol signature if needed"
