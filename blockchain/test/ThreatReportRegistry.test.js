const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ThreatReportRegistry Smart Contract", function () {
  let ThreatReportRegistry;
  let registry;
  let owner;
  let submitter1;
  let submitter2;

  // Sample deterministic Keccak-256 test hashes
  const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("phishfree:canonical:report-101"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("phishfree:canonical:report-102"));
  const sampleHash3 = ethers.keccak256(ethers.toUtf8Bytes("phishfree:canonical:report-103"));
  const zeroHash = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, submitter1, submitter2] = await ethers.getSigners();
    ThreatReportRegistry = await ethers.getContractFactory("ThreatReportRegistry");
    registry = await ThreatReportRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("should initialize with 0 total reports registered", async function () {
      expect(await registry.totalReportsRegistered()).to.equal(0);
      expect(await registry.getTotalReports()).to.equal(0);
    });

    it("should set deployer as the owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe("1. Successful Report Registration", function () {
    it("should register a valid report hash and increment count", async function () {
      const tx = await registry.connect(submitter1).registerReport(sampleHash1);
      await tx.wait();

      expect(await registry.totalReportsRegistered()).to.equal(1);
      expect(await registry.isReportRegistered(sampleHash1)).to.be.true;
    });
  });

  describe("2. Reject Zero Report Hash", function () {
    it("should revert when attempting to register bytes32(0)", async function () {
      await expect(
        registry.connect(submitter1).registerReport(zeroHash)
      ).to.be.revertedWith("Invalid report hash: zero hash rejected");
    });
  });

  describe("3. Prevent Duplicate Registration", function () {
    it("should revert if the exact report hash is registered twice", async function () {
      await registry.connect(submitter1).registerReport(sampleHash1);

      await expect(
        registry.connect(submitter2).registerReport(sampleHash1)
      ).to.be.revertedWith("Report hash already registered");
    });
  });

  describe("4. Successful Verification", function () {
    it("should return exists=true and matching stored hash for registered report", async function () {
      await registry.connect(submitter1).registerReport(sampleHash1);

      const [exists, registeredHash, timestamp, submitter] = await registry.verifyReport(sampleHash1);

      expect(exists).to.be.true;
      expect(registeredHash).to.equal(sampleHash1);
      expect(timestamp).to.be.gt(0);
      expect(submitter).to.equal(submitter1.address);
    });
  });

  describe("5. Unknown Hash Verification", function () {
    it("should return exists=false and empty fields for an unregistered hash", async function () {
      const [exists, registeredHash, timestamp, submitter] = await registry.verifyReport(sampleHash2);

      expect(exists).to.be.false;
      expect(registeredHash).to.equal(zeroHash);
      expect(timestamp).to.equal(0);
      expect(submitter).to.equal(ethers.ZeroAddress);
    });
  });

  describe("6. Correct Timestamp Recording", function () {
    it("should record the block timestamp of transaction inclusion", async function () {
      const tx = await registry.connect(submitter1).registerReport(sampleHash1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const details = await registry.getReportDetails(sampleHash1);
      expect(details.timestamp).to.equal(block.timestamp);
    });
  });

  describe("7. Correct Submitter Recording", function () {
    it("should accurately associate submitter wallet address with report", async function () {
      await registry.connect(submitter2).registerReport(sampleHash2);

      const details = await registry.getReportDetails(sampleHash2);
      expect(details.submitter).to.equal(submitter2.address);
      expect(details.reportHash).to.equal(sampleHash2);
      expect(details.exists).to.be.true;
    });
  });

  describe("8. Correct Event Emission", function () {
    it("should emit ReportRegistered event with indexed parameters", async function () {
      const tx = await registry.connect(submitter1).registerReport(sampleHash1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(registry, "ReportRegistered")
        .withArgs(sampleHash1, submitter1.address, block.timestamp);
    });
  });

  describe("9. Report Queries & Recent Exploration", function () {
    it("should revert getReportDetails for non-existent report", async function () {
      await expect(registry.getReportDetails(sampleHash3)).to.be.revertedWith("Report not registered");
    });

    it("should return recent reports in reverse chronological order", async function () {
      await registry.connect(submitter1).registerReport(sampleHash1);
      await registry.connect(submitter2).registerReport(sampleHash2);
      await registry.connect(owner).registerReport(sampleHash3);

      const recent = await registry.getRecentReports(2);
      expect(recent.length).to.equal(2);
      expect(recent[0].reportHash).to.equal(sampleHash3);
      expect(recent[1].reportHash).to.equal(sampleHash2);
    });

    it("should handle getRecentReports when requesting more than total available", async function () {
      await registry.connect(submitter1).registerReport(sampleHash1);

      const recent = await registry.getRecentReports(10);
      expect(recent.length).to.equal(1);
      expect(recent[0].reportHash).to.equal(sampleHash1);
    });
  });
});

