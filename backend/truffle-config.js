module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" ,// Match any network id
    }
  },
  // solc: {
  //   version: "0.5.16",
  //   optimizer: {
  //     enabled: true,
  //     runs: 200
  //   }
  // }
  compilers: {
    solc: {
      version: "0.6.8",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 200
       },
      //  evmVersion: "byzantium"
      // }
    },
  },
}