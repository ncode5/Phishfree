require("@nomicfoundation/hardhat-toolbox");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  process.env.BLOCKCHAIN_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

const PRIVATE_KEY =
  process.env.BLOCKCHAIN_PRIVATE_KEY ||
  process.env.PRIVATE_KEY ||
  "";

const sepoliaAccounts =
  PRIVATE_KEY && PRIVATE_KEY.replace(/^0x/, "").length === 64
    ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`]
    : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: sepoliaAccounts,
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

