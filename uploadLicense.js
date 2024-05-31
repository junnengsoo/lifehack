const Web3 = require('web3');
const contentRegistryArtifact = require('./build/contracts/ContentRegistry.json');
const licenseManagerArtifact = require('./build/contracts/LicenseManager.json');

const init = async () => {
    try {
        const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
        const id = await web3.eth.net.getId();
        console.log(`Network ID: ${id}`);

        const contentRegistryNetwork = contentRegistryArtifact.networks[id];
        const licenseManagerNetwork = licenseManagerArtifact.networks[id];

        if (!contentRegistryNetwork || !licenseManagerNetwork) {
            throw new Error(`No contract deployed on network with ID ${id}`);
        }

        const contentRegistry = new web3.eth.Contract(contentRegistryArtifact.abi, contentRegistryNetwork.address);
        const licenseManager = new web3.eth.Contract(licenseManagerArtifact.abi, licenseManagerNetwork.address);

        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
            throw new Error('No accounts found. Ensure your Ethereum client is configured correctly.');
        }

        const contentHash = "exampleHash"; // Replace with actual content hash
        console.log(`Registering content with hash: ${contentHash}`);

        await contentRegistry.methods.registerContent(contentHash).send({
            from: accounts[0],
            gas: 3000000
        });

        console.log(`Creating license template for content hash: ${contentHash}`);
        await licenseManager.methods.createLicenseTemplate(
            contentHash,
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + 31536000,
            true,
            false,
            false,
            web3.utils.toWei('1', 'ether'),
            web3.utils.toWei('0.1', 'ether'),
            "Example Attribution"
        ).send({
            from: accounts[0],
            gas: 3000000
        });

        const licenseeAccount = accounts[1];
        console.log(`Obtaining license for content hash: ${contentHash}`);
        await licenseManager.methods.obtainLicense(contentHash).send({
            from: licenseeAccount,
            value: web3.utils.toWei('1', 'ether'),
            gas: 3000000
        });

        const license = await licenseManager.methods.getLicense(contentHash).call({ from: licenseeAccount });
        console.log('License details retrieved:');
        console.log('  Content Hash:', license.contentHash);
        console.log('  Licensee:', license.licensee);
        console.log('  Start Date:', license.startDate);
        console.log('  End Date:', license.endDate);
        console.log('  Commercial Use:', license.commercialUse);
        console.log('  Modification Allowed:', license.modificationAllowed);
        console.log('  Exclusive:', license.exclusive);
        console.log('  License Fee:', web3.utils.fromWei(license.licenseFee, 'ether'));
        console.log('  Royalty:', web3.utils.fromWei(license.royalty, 'ether'));
        console.log('  Attribution Text:', license.attributionText);
    } catch (error) {
        console.error('Error interacting with the contract:', error);
    }
};

init();
