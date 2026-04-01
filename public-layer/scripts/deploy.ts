import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment for MVP Public Verification Layer...");

  // 1. Deploy Verifier
  console.log("Deploying Verifier.sol...");
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`✅ Verifier deployed to: ${verifierAddress}`);

  // 2. Deploy AnchorRegistry
  console.log("Deploying AnchorRegistry.sol...");
  const AnchorRegistry = await ethers.getContractFactory("AnchorRegistry");
  const registry = await AnchorRegistry.deploy(verifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ AnchorRegistry deployed to: ${registryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
