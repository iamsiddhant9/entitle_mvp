require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const WALLET_PRIVATE_KEY   = process.env.WALLET_PRIVATE_KEY   || "0x0000000000000000000000000000000000000000000000000000000000000001";

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
    // Local Hardhat network (for tests)
    hardhat: {
      chainId: 31337,
    },

    // Polygon Amoy testnet
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      chainId: 80002,
      accounts: [WALLET_PRIVATE_KEY],
      gasPrice: "auto",
    },
  },

  // Polygonscan API key for contract verification (optional)
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },

  paths: {
    sources:   "./",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
