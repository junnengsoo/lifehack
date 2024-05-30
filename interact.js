const {Web3} = require('web3');
const contract = require('./build/contracts/ImageRegistry.json');

const init = async () => {
    const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
    const id = await web3.eth.net.getId();
    const deployedNetwork = contract.networks[id];
    const imageRegistry = new web3.eth.Contract(
        contract.abi,
        deployedNetwork.address
    );

    const accounts = await web3.eth.getAccounts();

    const fingerprint = "your_image_fingerprint";
    const metadata = "image_metadata";

    await imageRegistry.methods.registerImage(fingerprint, metadata).send({
        from: accounts[0],
        gas: 3000000  // Set a higher gas limit
    });

    const image = await imageRegistry.methods.getImage(fingerprint).call();
    console.log(image);
};

init().catch(error => console.error(error));
