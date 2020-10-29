var DutchAuction = artifacts.require("./DutchAuction.sol");

module.exports = function(deployer) {
  deployer.deploy(DutchAuction);
};
