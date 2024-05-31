const Web3 = require('web3');

// Web3 setup
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));

// Load ABI and contract address
const contentRegistryABI = require('../build/contracts/ContentRegistry.json').abi;
const contentRegistryAddress = require('../build/contracts/ContentRegistry.json').networks['5777'].address; // Replace with the network ID used by Ganache

const contentRegistry = new web3.eth.Contract(contentRegistryABI, contentRegistryAddress);

// Function to register content
async function registerContent(imageHash) {
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];

    // Estimate gas required for the transaction
    const gasEstimate = await contentRegistry.methods.registerContent(imageHash).estimateGas({ from });

    // Optionally, get the current gas price
    const gasPrice = await web3.eth.getGasPrice();

    // Send the transaction with the estimated gas plus a buffer and specified gas price
    await contentRegistry.methods.registerContent(imageHash).send({ from, gas: gasEstimate + 10000, gasPrice });
    return imageHash;
}

// Function to get content details
async function getContentDetails(imageHash) {
    const content = await contentRegistry.methods.getContentDetails(imageHash).call();
    return [content[0], content[1], content[2]]; // Return an array of values
}

module.exports = {
    registerContent,
    getContentDetails,
};
