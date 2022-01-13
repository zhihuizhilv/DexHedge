const hre = require("hardhat");
const ethers = hre.ethers;
const BigNumber = ethers.BigNumber;


module.exports = {
    ganache: {
        factory: "0x02C12819f6D6d4bB4070ADa71bf766e84c5DC75d",
        swapRouter: "0x9ec568059470037712C40c11aBeB3815C7A09f89"
    },

    bsc_testnet: {
        factory: "0x0B43eD7bFe24064C31A429F6E4081E9846516538",
        swapRouter: "0x8cF5A9e9Ec3422AeD2e5053F4A1B98fFe5Cb900C",
        USDT: "0xFe57a912FcE2aE127CaCeDBBf8486A6891345eB9",
        TToken: "0xb9725546A70976CC2061cfBD2cc86Ef7A0e9Fa23"
    },

    bsc: {
    }
}