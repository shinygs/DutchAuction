module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" ,// Match any network id
    }
  },
  compilers: {
    solc: {
      version: "0.6.8",    // Fetch exact version from solc-bin (default: truffle's version)
       optimizer: {
         enabled: true,
         runs: 200
       },
    },
  },
}