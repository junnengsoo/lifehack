const Web3 = require('web3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const Image = require('../models/Image'); // Import the Image model
const { imageHash, hash } = require('image-hash');
const resemble = require('resemblejs');
const similarity = require('image-similarity');

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
async function registerContent(imageHash, from) {
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

// Function to check image similarity

async function checkImageSimilarity(filePath) {
    const uploadsDir = path.join(__dirname, '../uploads');
    const uploadedImage = await Jimp.read(filePath);
    let mostSimilar = null;
    let highestSimilarity = 0;
    const similarityThreshold = 0.995; // Similarity threshold for copyright infringement
    const power = 9;

    console.log(`Uploaded image path: ${filePath}`);

    const files = fs.readdirSync(uploadsDir);

    for (const file of files) {
        const fileToCompare = path.join(uploadsDir, file);
        if (!fs.lstatSync(fileToCompare).isFile()) continue; // Skip directories

        const comparisonImage = await Jimp.read(fileToCompare);

        const diff = Jimp.diff(uploadedImage, comparisonImage);
        let similarityScore = 1 - diff.percent;

        similarityScore = Math.pow(similarityScore, power);

        console.log(`Comparing against: ${fileToCompare}, similarity: ${similarityScore}`);

        if (similarityScore > highestSimilarity) {
            highestSimilarity = similarityScore;
            mostSimilar = fileToCompare;
        }
    }

    console.log(`Most similar image: ${mostSimilar}, Highest similarity: ${highestSimilarity}`);

    return { mostSimilar, highestSimilarity, isCopyrightInfringed: highestSimilarity > similarityThreshold };
}



async function getRegisteredImages() {
    // This function should fetch registered images from the blockchain
    return [
        // Example format
        { filePath: 'uploads/d15ee3f7-136d-4580-87e6-28166ba8feba.jpeg' },
        { filePath: 'path/to/image2.jpg' }
    ];
}

// Function to compare two images
function compareImages(image1Path, image2Path) {
    return new Promise((resolve, reject) => {
        resemble(image1Path)
            .compareTo(image2Path)
            .onComplete(data => {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data);
                }
            });
    });
}

module.exports = {
    registerContent,
    contentRegistryABI,
    transformABI,
    checkImageSimilarity,
    getRegisteredImages,
    getContentDetails,
    getCreatorContents,
    getAllContents
};
