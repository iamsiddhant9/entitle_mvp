const hre = require("hardhat");
const crypto = require("crypto");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n[START] Seeding 10 demo users on network: ${hre.network.name}`);
  console.log(`[INFO] Account: ${deployer.address}`);

  // Need to provide the deployed contract address here
  // You can pass it as an environment variable or hardcode it
  const registryAddress = process.env.ELIGIBILITY_REGISTRY_ADDRESS;
  
  if (!registryAddress) {
    console.error("[ERROR] Please set ELIGIBILITY_REGISTRY_ADDRESS in your .env or export it before running.");
    console.error("Example: export ELIGIBILITY_REGISTRY_ADDRESS=0x... && npx hardhat run scripts/seed_demo_users.js --network amoy");
    process.exit(1);
  }

  console.log(`[INFO] Connecting to EligibilityRegistry at: ${registryAddress}`);
  const EligibilityRegistry = await hre.ethers.getContractFactory("EligibilityRegistry");
  const registry = EligibilityRegistry.attach(registryAddress);

  console.log("\n[ACTION] Registering 10 users on the blockchain...\n");

  for (let i = 1; i <= 10; i++) {
    // Generate a mock eligibility JSON and hash it
    const mockEligibility = JSON.stringify({
      userId: `user_demo_${i}`,
      schemes: ["PM-Kisan", "Ayushman Bharat"],
      timestamp: Date.now()
    });
    
    // Create SHA-256 hash
    const hashHex = "0x" + crypto.createHash('sha256').update(mockEligibility).digest('hex');
    const certificateId = `DEMO-CERT-2026-${i.toString().padStart(4, '0')}`;

    console.log(`User ${i}:`);
    console.log(`  - Certificate : ${certificateId}`);
    console.log(`  - Hash        : ${hashHex}`);

    try {
      // Call the storeHash function on the smart contract
      const tx = await registry.storeHash(hashHex, certificateId);
      console.log(`  - Tx Hash     : ${tx.hash}`);
      
      // Wait for transaction confirmation
      await tx.wait();
      console.log(`  [SUCCESS] Stored on blockchain!`);
    } catch (error) {
      if (error.message.includes("hash already stored")) {
        console.log(`  [WARNING] Hash already exists on blockchain.`);
      } else {
        console.log(`  [ERROR] Failed: ${error.message}`);
      }
    }
    console.log("");
  }

  console.log("[SUCCESS] Successfully seeded 10 demo users!");
  
  if (hre.network.name === "amoy") {
    console.log(`\nYou can verify the transactions at: https://amoy.polygonscan.com/address/${registryAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[ERROR] Seeding failed:", err);
    process.exit(1);
  });
