const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Web3 = require('web3');
const { createLicenseTemplate, obtainLicense, getLicensesForContent, getUserLicenses, getLicensesForTemplate } = require('../controller/licenseManager');
const { registerContent, getContentDetails, getCreatorContents, getAllContents, contentRegistryABI } = require('../controller/contentRegistry');

const Image = require('../models/Image'); // Import the Image model

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Initialize Web3
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));

// Helper function to generate image hash
// API to check similarity
router.post('/check-similarity', upload.single('image'), async (req, res) => {
    const tempDir = path.join(__dirname, '../uploads/temp');
    const mainUploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(tempDir, req.file.filename);

    try {
        // Move the uploaded image to the temp directory
        fs.renameSync(req.file.path, filePath);

        // Perform similarity check excluding the temp directory
        const { mostSimilar, highestSimilarity, isCopyrightInfringed } = await checkImageSimilarity(filePath);
        if (mostSimilar) {
            res.status(200).json({
                message: 'A similar image has been found',
                similarity: highestSimilarity ,
                similarImage: mostSimilar,
                isCopyrightInfringed: isCopyrightInfringed
            });
        } else {
            res.status(200).json({ message: 'No similar image found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        setTimeout(() => fs.unlinkSync(filePath), 5000); // Clean up the uploaded file after sending the response
    }
});

// Helper function to generate image hash MOVE TO CONTROLLER LATER
function generateImageHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ message: 'Backend is working' });
});

// Endpoint to get ABI
router.get('/abi', (req, res) => {
    res.status(200).json(contentRegistryABI);
});

// API to register content
router.post('/register', upload.single('image'), async (req, res) => {
    const filePath = req.file.path;
    const destPath = path.join(__dirname, '../uploads/', `${req.file.filename}.jpg`);
    const { account, signature } = req.body;

    console.log(req.body);
    try {
        // Move the file to the desired directory before any blockchain operation
        fs.renameSync(filePath, destPath);

        // Verify the signature
        const message = "Please sign this message to verify your address.";
        const recoveredAddress = web3.eth.accounts.recover(message, signature);
        console.log("Recovered address:", recoveredAddress);

        if (!recoveredAddress || !account) {
            console.log("Invalid recovered address or account");
            return res.status(400).json({ error: 'Invalid recovered address or account' });
        }

        if (recoveredAddress.toLowerCase() !== account.toLowerCase()) {
            console.log("Signature verification failed");
            return res.status(400).json({ error: 'Signature verification failed' });
        }

        // Generate hash from the image
        const imageHash = generateImageHash(destPath);

        // Check if the content is already registered on the blockchain
        try {
            console.log("Checking if content is already registered");
            const contentDetails = await getContentDetails(imageHash);
            console.log("Content already registered:", contentDetails);
            return res.status(400).json({ error: 'Content already registered', details: contentDetails });
        } catch (error) {
            if (error.message !== "Content not found") {
                console.error("Error checking content details:", error.message);
            }
            // Continue with registration if content not found
            console.log("Content not found, proceeding with registration");
        }

        // Register the content on the blockchain
        await registerContent(imageHash, account);
        console.log("Content registered on the blockchain");

        res.status(200).json({ message: 'Content registered successfully', hash: imageHash });
    } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// API to get content details
router.post('/content-details', async (req, res) => {
    const { contentHash } = req.body;

    try {
        // Get content details from the blockchain
        const [hash, owner, timestamp] = await getContentDetails(contentHash);

        if (owner !== '0x0000000000000000000000000000000000000000') {
            res.status(200).json({ message: 'Content found', hash, owner, timestamp });
        } else {
            res.status(404).json({ message: 'No content found for the given hash', hash });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to create a license template
router.post('/create-license-template', async (req, res) => {
    const { contentHash, startDate, endDate, commercialUse, modificationAllowed, exclusive, licenseFee, royalty, attributionText } = req.body;

    try {
        await createLicenseTemplate(contentHash, startDate, endDate, commercialUse, modificationAllowed, exclusive, licenseFee, royalty, attributionText);
        res.status(200).json({ message: 'License template created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to obtain a license
router.post('/obtain-license', async (req, res) => {
    const { contentHash, templateId } = req.body;

    try {
        await obtainLicense(contentHash, templateId);
        res.status(200).json({ message: 'License obtained successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get all digital assets tagged to a creator
router.post('/creator-contents', async (req, res) => {
    const { creatorAddress } = req.body;

    try {
        const contents = await getCreatorContents(creatorAddress);
        res.status(200).json(contents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get ABI
router.get('/abi', (req, res) => {
    try {
        const abi = getContentRegistryABI();
        const transformedAbi = transformABI(abi);
        res.status(200).json(transformedAbi);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get all licenses for a specific content
router.post('/licenses-for-content', async (req, res) => {
    const { contentHash } = req.body;
    try {
        const licenses = await getLicensesForContent(contentHash);
        res.status(200).json(licenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get all licenses for a specific user
router.post('/user-licenses', async (req, res) => {
    const { userAddress } = req.body;

    try {
        const licenses = await getUserLicenses(userAddress);
        res.status(200).json(licenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get all licenses issued for a specific license template
router.post('/licenses-for-template', async (req, res) => {
    const { contentHash, templateId } = req.body;

    try {
        const licenses = await getLicensesForTemplate(contentHash, templateId);
        res.status(200).json(licenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get all contents
router.get('/all-contents', async (req, res) => {
    try {
        const contents = await getAllContents();
        res.status(200).json(contents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
