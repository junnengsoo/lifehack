const Web3 = require('web3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const Image = require('../models/Image'); // Import the Image model

// Web3 setup
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));

// Load ABI and contract address
const contentRegistryABI = require('../build/contracts/ContentRegistry.json').abi;
const contentRegistryAddress = require('../build/contracts/ContentRegistry.json').networks['5777'].address; // Replace with the network ID used by Ganache

const contentRegistry = new web3.eth.Contract(contentRegistryABI, contentRegistryAddress);

function transformABI(abi) {
    return abi.map(item => {
        if (item.type === 'function') {
            return {
                name: item.name,
                inputs: item.inputs.map(input => `${input.type} ${input.name}`).join(', '),
                outputs: item.outputs.map(output => output.type).join(', '),
                stateMutability: item.stateMutability
            };
        } else if (item.type === 'event') {
            return {
                name: item.name,
                inputs: item.inputs.map(input => `${input.type} ${input.name}`).join(', '),
                anonymous: item.anonymous
            };
        }
        return item;
    });
}

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

// Function to get all contents for a creator
async function getCreatorContents(creatorAddress) {
    const contents = await contentRegistry.methods.getCreatorContents(creatorAddress).call();
    return contents;
}

// Function to get all contents
async function getAllContents() {
    const contents = await contentRegistry.methods.getAllContents().call();
    return contents;
}
async function checkImageSimilarity(filePath) {
    const targetImage = await Jimp.read(filePath);
    const targetHash = await targetImage.hash();

    const images = await Image.find();

    let mostSimilar = null;
    let highestSimilarity = 0;

    for (const image of images) {
        const dbImage = await Jimp.read(image.filePath);
        const dbHash = await dbImage.hash();

        const similarity = Jimp.distance(targetImage, dbImage);
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            mostSimilar = image;
        }
    }

    return { mostSimilar, highestSimilarity };
}

async function getRegisteredImages() {
    // This function should fetch registered images from the blockchain
    return [
        // Example format
        { filePath: 'path/to/image1.jpg' },
        { filePath: 'path/to/image2.jpg' }
    ];
}

module.exports = {
    registerContent,
    contentRegistryABI,
    transformABI,
    checkImageSimilarity,
    getContentDetails,
    getCreatorContents,
    getAllContents
};
