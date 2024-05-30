const ImageRegistry = artifacts.require("ImageRegistry");

module.exports = function (deployer) {
  deployer.deploy(ImageRegistry);
};
