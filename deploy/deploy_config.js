const hre = require("hardhat");
const ethers = hre.ethers;
const BigNumber = ethers.BigNumber;


module.exports = {
    ganache: {
        factory: "0x02C12819f6D6d4bB4070ADa71bf766e84c5DC75d",
        swapRouter: "0x9ec568059470037712C40c11aBeB3815C7A09f89"
    },

    bsc_testnet: {
        factory: "0x19Eb1f583eEC6572dD9Bc0579523f6Ae16032E0A",
        swapRouter: "0x8cF5A9e9Ec3422AeD2e5053F4A1B98fFe5Cb900C"
    },

    bsc: {
    }
}