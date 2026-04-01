import { ethers } from 'ethers';
import { config } from '../config';

export let ethContract: ethers.Contract;

// ABI matches the auto-generated Verifier.sol from snarkjs + our AnchorRegistry
// Public signals: [p1Compliant, p2Compliant, maxTempThreshold, maxTransportTime]
const registryABI = [
    "function anchorLot(string lotId, bytes32 merkleRoot, uint[2] pA, uint[2][2] pB, uint[2] pC, uint[4] pubSignals) external",
    "function getLot(string lotId) external view returns (bool exists, bool p1, bool p2, bytes32 root)"
];

export async function initEthereum() {
    console.log("==> Bootstrapping Ethereum RPC Connection...");
    const provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
    const wallet = new ethers.Wallet(config.ethereum.privateKey, provider);
    ethContract = new ethers.Contract(config.ethereum.registryAddress, registryABI, wallet);
    console.log("✅ Attached to Ethereum RPC");
}

export async function submitAnchorTx(
    lotId: string, 
    merkleRoot: string,
    pA: [string, string],
    pB: [[string, string], [string, string]],
    pC: [string, string],
    publicSignals: string[]
) {
    console.log("Submitting Groth16 proof + anchor to Ethereum...");

    // Convert public signals to uint256 for the contract
    const pubSignals: [bigint, bigint, bigint, bigint] = [
        BigInt(publicSignals[0]),
        BigInt(publicSignals[1]),
        BigInt(publicSignals[2]),
        BigInt(publicSignals[3])
    ];

    const tx = await ethContract.anchorLot(
        lotId,
        merkleRoot,
        [BigInt(pA[0]), BigInt(pA[1])],
        [[BigInt(pB[0][0]), BigInt(pB[0][1])], [BigInt(pB[1][0]), BigInt(pB[1][1])]],
        [BigInt(pC[0]), BigInt(pC[1])],
        pubSignals
    );

    console.log(`Transaction sent! TX hash: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Lot securely Anchored to Public Ledger (with real ZK proof).");
    return tx;
}
