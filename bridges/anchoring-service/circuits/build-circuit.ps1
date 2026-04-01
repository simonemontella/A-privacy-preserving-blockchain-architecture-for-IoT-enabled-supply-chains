# Build Script - Circom Circuit Compilation and Groth16 Setup
# PowerShell version for Windows development
#
# Prerequisites:
#   - circom installed (npm install -g circom)
#   - snarkjs installed (npm install snarkjs)
#   - Node.js >= 18
#
# Usage: .\circuits\build-circuit.ps1

$ErrorActionPreference = "Stop"

$CIRCUIT_NAME = "compliance"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BUILD_DIR = Join-Path $SCRIPT_DIR "build"
$PTAU_FILE = Join-Path $BUILD_DIR "pot14_final.ptau"

Write-Host "========================================"
Write-Host "  ZK Circuit Build - $CIRCUIT_NAME"
Write-Host "========================================"

# Create build directory
if (-not (Test-Path $BUILD_DIR)) {
    New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null
}

# Step 1: Compile the Circom circuit
Write-Host ""
Write-Host "[1/5] Compiling Circom circuit..."

$circomFile = Join-Path $SCRIPT_DIR "$CIRCUIT_NAME.circom"
circom $circomFile --r1cs --wasm --sym -o $BUILD_DIR

if ($LASTEXITCODE -ne 0) { throw "Circom compilation failed" }
Write-Host "  OK: Generated r1cs and wasm"

# Step 2: Download Powers of Tau
Write-Host ""
Write-Host "[2/5] Downloading Powers of Tau (pot14)..."

if (-not (Test-Path $PTAU_FILE)) {
    $ptauUrl = "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau"
    Invoke-WebRequest -Uri $ptauUrl -OutFile $PTAU_FILE
    Write-Host "  OK: Downloaded Powers of Tau"
} else {
    Write-Host "  SKIP: Powers of Tau already present"
}

# Step 3: Groth16 Phase-2 Setup
Write-Host ""
Write-Host "[3/5] Running Groth16 setup (phase 2)..."

$r1csPath = Join-Path $BUILD_DIR "$CIRCUIT_NAME.r1cs"
$zkey0Path = Join-Path $BUILD_DIR "${CIRCUIT_NAME}_0000.zkey"
$zkeyFinalPath = Join-Path $BUILD_DIR "${CIRCUIT_NAME}_final.zkey"

npx snarkjs groth16 setup $r1csPath $PTAU_FILE $zkey0Path
if ($LASTEXITCODE -ne 0) { throw "Groth16 setup failed" }

$ts = Get-Date -Format "yyyyMMddHHmmss"
npx snarkjs zkey contribute $zkey0Path $zkeyFinalPath --name="dev-contribution" -v -e="random-entropy-$ts"
if ($LASTEXITCODE -ne 0) { throw "Zkey contribution failed" }

Write-Host "  OK: Generated final zkey"

# Step 4: Export Verification Key
Write-Host ""
Write-Host "[4/5] Exporting verification key..."

$vkeyPath = Join-Path $BUILD_DIR "$CIRCUIT_NAME.vkey.json"
npx snarkjs zkey export verificationkey $zkeyFinalPath $vkeyPath
if ($LASTEXITCODE -ne 0) { throw "Verification key export failed" }

Write-Host "  OK: Generated vkey.json"

# Step 5: Generate Solidity Verifier
Write-Host ""
Write-Host "[5/5] Generating Solidity Verifier contract..."

$verifierPath = Join-Path $BUILD_DIR "Verifier.sol"
npx snarkjs zkey export solidityverifier $zkeyFinalPath $verifierPath
if ($LASTEXITCODE -ne 0) { throw "Solidity verifier generation failed" }

Write-Host "  OK: Generated Verifier.sol"

# Summary
Write-Host ""
Write-Host "========================================"
Write-Host "  BUILD COMPLETE"
Write-Host "========================================"
Write-Host ""
Write-Host "  Build artifacts in: $BUILD_DIR"
Write-Host ""
Write-Host "  Next: copy Verifier.sol to public-layer/contracts/"
Write-Host "  Then: npx ts-node circuits/test-circuit.ts"
