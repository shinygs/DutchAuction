const GLDToken = artifacts.require("./GLDToken.sol");
const DutchAuction = artifacts.require("./DutchAuction.sol");

module.exports = function(deployer,network,accounts) {
  const userAddress = accounts[0];
  deployer.deploy(GLDToken,10).then(()=>{ // 10 tokens are generated
    return deployer.deploy(DutchAuction,userAddress,10,10,1); //10 tokens, starting price:10, price factor:1
  });
  };
