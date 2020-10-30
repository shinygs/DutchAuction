const GLDToken = artifacts.require("./GLDToken.sol");
const DutchAuction = artifacts.require("./DutchAuction.sol");

module.exports = function(deployer,network,accounts) {
  const userAddress = accounts[0];
  deployer.deploy(GLDToken,10).then(()=>{
    return deployer.deploy(DutchAuction,userAddress,100,1);
  });
  };
