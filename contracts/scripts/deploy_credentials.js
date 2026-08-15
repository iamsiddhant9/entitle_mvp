const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DocumentCredentialRegistry with account:", deployer.address);

  // Get the ContractFactory
  const DocumentCredentialRegistry = await hre.ethers.getContractFactory("DocumentCredentialRegistry");

  // Deploy the contract with deployer as the initial owner
  const registry = await DocumentCredentialRegistry.deploy(deployer.address);
  
  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();
  
  console.log("DocumentCredentialRegistry deployed to:", contractAddress);
  
  // Simulated Issuers (Revenue, Education, Welfare)
  // We'll set up 3 simulated wallets if available, or just the deployer for testing
  const signers = await hre.ethers.getSigners();
  if (signers.length >= 4) {
      console.log("Adding simulated issuers...");
      await registry.addAuthorizedIssuer(signers[1].address);
      await registry.addAuthorizedIssuer(signers[2].address);
      await registry.addAuthorizedIssuer(signers[3].address);
      console.log("Added authorized issuers:", signers[1].address, signers[2].address, signers[3].address);
  } else {
      console.log("Adding deployer as authorized issuer for testing...");
      await registry.addAuthorizedIssuer(deployer.address);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
