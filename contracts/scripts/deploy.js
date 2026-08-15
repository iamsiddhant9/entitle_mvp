/**
 * deploy.js — Deploys EligibilityRegistry to Polygon Amoy (or local Hardhat).
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network amoy    # real deployment
 *   npx hardhat run scripts/deploy.js --network hardhat # local test
 *
 * After deployment, copy the printed contract address into your backend .env:
 *   ELIGIBILITY_REGISTRY_ADDRESS=0x...
 */

const { ethers, network } = require("hardhat");

async function main() {
  console.log(`\n🚀 Deploying EligibilityRegistry to: ${network.name}\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📬 Deployer address : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance : ${ethers.formatEther(balance)} MATIC\n`);

  // Deploy contract — pass deployer as initialOwner (Ownable constructor)
  const EligibilityRegistry = await ethers.getContractFactory("EligibilityRegistry");
  const registry = await EligibilityRegistry.deploy(deployer.address);
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();

  console.log(`✅ EligibilityRegistry deployed!`);
  console.log(`📄 Contract address : ${contractAddress}`);

  if (network.name === "amoy") {
    const txHash = registry.deploymentTransaction()?.hash;
    console.log(`🔗 Explorer URL     : https://amoy.polygonscan.com/tx/${txHash}`);
    console.log(`\n📋 Add this to your backend .env:`);
    console.log(`   ELIGIBILITY_REGISTRY_ADDRESS=${contractAddress}`);
  }

  // Quick smoke test — verify() on an empty hash should return false
  const dummyHash = ethers.zeroPadBytes("0x01", 32);
  const [exists] = await registry.verify(dummyHash);
  console.log(`\n🧪 Smoke test verify(dummy): ${exists === false ? "✅ PASS (not found)" : "❌ FAIL"}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
