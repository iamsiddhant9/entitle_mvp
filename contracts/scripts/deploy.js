// Deploy EligibilityRegistry to Polygon Amoy:
//   npx hardhat run scripts/deploy.js --network amoy
const hre = require("hardhat");

async function main() {
  const registry = await hre.ethers.deployContract("EligibilityRegistry");
  await registry.waitForDeployment();

  console.log(`EligibilityRegistry deployed to: ${registry.target}`);
  console.log("→ Set ELIGIBILITY_REGISTRY_ADDRESS to this address in the backend environment.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
