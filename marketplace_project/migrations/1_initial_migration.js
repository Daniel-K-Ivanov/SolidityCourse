var Migrations = artifacts.require("./Migrations.sol");
var Ownable = artifacts.require("./Ownable.sol");
var Safemath = artifacts.require("./SafeMath.sol");
var ProductLib = artifacts.require("./ProductLib.sol");
var Marketplace = artifacts.require("./Marketplace.sol");

module.exports = function(deployer) {
  deployer.deploy(Safemath);
  deployer.link(Safemath, [ProductLib, Marketplace]);
  deployer.deploy(ProductLib);
  deployer.link(ProductLib, Marketplace);

  deployer.deploy(Ownable);
  deployer.deploy(Marketplace);
  deployer.deploy(Migrations);
};
