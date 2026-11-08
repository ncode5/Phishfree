const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("=================================================");
  console.log("PhishFree ThreatReportRegistry Deployment");
  console.log("=================================================");
  console.log(`Deploying from account: ${deployer.address}`);
  console.log(`Network Name:           ${network.name}`);
  console.log(`Chain ID:               ${network.chainId}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account Balance:        ${hre.ethers.formatEther(balance)} ETH`);

  console.log("\nDeploying ThreatReportRegistry contract...");
  const ThreatReportRegistry = await hre.ethers.getContractFactory("ThreatReportRegistry");
  const registry = await ThreatReportRegistry.deploy();

  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();

  console.log(`\nThreatReportRegistry deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);

  // Save deployment artifact with address & ABI for backend consumption
  const deploymentDir = path.resolve(__dirname, "../../backend/app/web3");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/ThreatReportRegistry.sol/ThreatReportRegistry.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifact.abi;
  }

  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: abi
  };

  const outputPath = path.resolve(deploymentDir, "contract_deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Saved deployment metadata to: ${outputPath}`);

  console.log("=================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

