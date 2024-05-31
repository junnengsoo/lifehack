const Web3 = require('web3');

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
async function obtainLicense(contentHash, templateId) {
    const accounts = await web3.eth.getAccounts();
    await licenseManager.methods.obtainLicense(contentHash, templateId).send({ from: accounts[0] });
}

// Function to pay royalty
async function payRoyalty(contentHash, licenseIndex, amount) {
    const accounts = await web3.eth.getAccounts();
    await licenseManager.methods.payRoyalty(contentHash, licenseIndex).send({ from: accounts[0], value: amount });
}

// Function to get all licenses for a specific content
async function getLicensesForContent(contentHash) {
    const licenses = await licenseManager.methods.getLicensesForContent(contentHash).call();
    return licenses;
}

// Function to get all licenses acquired for a specific user
async function getUserLicenses(userAddress) {
    const licenses = await licenseManager.methods.getUserLicenses(userAddress).call();
    return licenses;
}

// Function to get all licenses issued for a specific license template
async function getLicensesForTemplate(contentHash, templateId) {
    const licenses = await licenseManager.methods.getLicensesForTemplate(contentHash, templateId).call();
    return licenses;
}

module.exports = {
    createLicenseTemplate,
    obtainLicense,
    payRoyalty,
    getLicensesForContent,
    getUserLicenses,
    getLicensesForTemplate,
};
