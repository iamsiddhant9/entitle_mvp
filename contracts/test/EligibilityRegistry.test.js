/**
 * test/EligibilityRegistry.test.js
 * Hardhat + ethers.js tests for EligibilityRegistry.
 *
 * Run: npx hardhat test
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EligibilityRegistry", function () {
  let registry;
  let owner;
  let nonOwner;
  let dummyHash;

  beforeEach(async function () {
    [owner, nonOwner] = await ethers.getSigners();

    const EligibilityRegistry = await ethers.getContractFactory("EligibilityRegistry");
    registry = await EligibilityRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    // A deterministic test hash
    dummyHash = ethers.keccak256(ethers.toUtf8Bytes("test-eligibility-hash"));
  });

  // ── Deployment ─────────────────────────────────────────────────────────────

  it("should deploy with the correct owner", async function () {
    expect(await registry.owner()).to.equal(owner.address);
  });

  // ── storeHash ──────────────────────────────────────────────────────────────

  it("owner can store a hash", async function () {
    await expect(registry.connect(owner).storeHash(dummyHash, "CERT-1"))
      .to.emit(registry, "HashStored")
      .withArgs(dummyHash, "CERT-1", owner.address, await latestTimestamp());
  });

  it("non-owner cannot store a hash", async function () {
    await expect(
      registry.connect(nonOwner).storeHash(dummyHash, "CERT-1")
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("cannot store the same hash twice", async function () {
    await registry.connect(owner).storeHash(dummyHash, "CERT-1");
    await expect(
      registry.connect(owner).storeHash(dummyHash, "CERT-2")
    ).to.be.revertedWith("EligibilityRegistry: hash already stored");
  });

  // ── verify ─────────────────────────────────────────────────────────────────

  it("verify returns false for an unstored hash", async function () {
    const [exists, timestamp] = await registry.verify(dummyHash);
    expect(exists).to.be.false;
    expect(timestamp).to.equal(0n);
  });

  it("verify returns true and timestamp after storing", async function () {
    const tx = await registry.connect(owner).storeHash(dummyHash, "CERT-1");
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    const [exists, timestamp] = await registry.verify(dummyHash);
    expect(exists).to.be.true;
    expect(timestamp).to.equal(BigInt(block.timestamp));
  });

  // ── certificateIds ────────────────────────────────────────────────────────

  it("stores certificate ID alongside hash", async function () {
    await registry.connect(owner).storeHash(dummyHash, "CERT-42");
    expect(await registry.certificateIds(dummyHash)).to.equal("CERT-42");
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function latestTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return BigInt(block.timestamp);
}
