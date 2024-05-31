const Web3 = require('web3');
const contentRegistry = require('./contentRegistry');

// Web3 setup
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));

// Load ABI and contract address
const licenseManagerABI = require('../build/contracts/LicenseManager.json').abi;
const licenseManagerAddress = require('../build/contracts/LicenseManager.json').networks['5777'].address; // Replace with the network ID used by Ganache

const licenseManager = new web3.eth.Contract(licenseManagerABI, licenseManagerAddress);

// Function to create a license template
async function createLicenseTemplate(contentHash, startDate, endDate, commercialUse, modificationAllowed, exclusive, licenseFee, royalty, attributionText) {
    const accounts = await web3.eth.getAccounts();
    await licenseManager.methods.createLicenseTemplate(contentHash, startDate, endDate, commercialUse, modificationAllowed, exclusive, licenseFee, royalty, attributionText).send({ from: accounts[0] });
}

// Function to obtain a license
async function obtainLicense(contentHash) {
    const accounts = await web3.eth.getAccounts();
    const licenseTemplate = await licenseManager.methods.licenseTemplates(contentHash).call();
    await licenseManager.methods.obtainLicense(contentHash).send({ from: accounts[0], value: licenseTemplate.licenseFee });
}

// Function to pay royalty
async function payRoyalty(contentHash, amount) {
    const accounts = await web3.eth.getAccounts();
    await licenseManager.methods.payRoyalty(contentHash).send({ from: accounts[0], value: amount });
}

module.exports = {
    createLicenseTemplate,
    obtainLicense,
    payRoyalty
};
