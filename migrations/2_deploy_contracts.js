const ContentRegistry = artifacts.require("ContentRegistry");
const LicenseManager = artifacts.require("LicenseManager")

module.exports = async function (deployer) {
  await deployer.deploy(ContentRegistry);
  const contentRegistry = await ContentRegistry.deployed();

  await deployer.deploy(LicenseManager, contentRegistry.address);
};
