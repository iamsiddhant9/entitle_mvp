require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: AMOY_RPC_URL,
      accounts: WALLET_PRIVATE_KEY ? [WALLET_PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
};
