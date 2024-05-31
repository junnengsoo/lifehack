const Web3 = require('web3');
const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const router = express.Router();

// Web3 setup
const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');

// Load ABI and contract address
const contentRegistryABI = require('../build/contracts/ContentRegistry.json').abi;
const contentRegistryAddress = require('../build/contracts/ContentRegistry.json').networks['5777'].address;

const contentRegistry = new web3.eth.Contract(contentRegistryABI, contentRegistryAddress);

// Function to generate image hash
function generateImageHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

// Function to register content
async function registerContent(filePath) {
    const imageHash = generateImageHash(filePath);
    const accounts = await web3.eth.getAccounts();
    await contentRegistry.methods.registerContent(imageHash).send({ from: accounts[0] });
    return imageHash;
}

// Function to check ownership
async function checkOwnership(filePath) {
    const imageHash = generateImageHash(filePath);
    const ownerAddress = await contentRegistry.methods.getOwner(imageHash).call();
    return { ownerAddress, imageHash };
}


module.exports = { router,
    registerContent,
    checkOwnership,
    contentRegistryABI
};
