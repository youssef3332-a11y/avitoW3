const Shop = artifacts.require("shop");

module.exports = function (deployer) {
    deployer.deploy(Shop);
};