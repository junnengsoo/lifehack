const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createLicenseTemplate, obtainLicense, payRoyalty } = require('../controller/licenseManager');
const { registerContent, getContentDetails, contentRegistryABI } = require('../controller/contentRegistry');


const router = express.Router();
const upload = multer({ dest: 'uploads/' });

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

    try {
        // Move the file to the desired directory
        fs.renameSync(filePath, destPath);

        // Generate hash from the image
        const imageHash = generateImageHash(destPath);

        // Register the content on the blockchain
        await registerContent(imageHash);

        res.status(200).json({ message: 'Content registered successfully', hash: imageHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        // Clean up the file after processing
        fs.unlinkSync(destPath);
    }
});

// API to get content details
router.post('/content-details', upload.single('image'), async (req, res) => {
    const filePath = req.file.path;
    const destPath = path.join(__dirname, '../uploads/', req.file.originalname);

    try {
        // Move the file to the desired directory
        fs.renameSync(filePath, destPath);

        // Generate hash from the image
        const imageHash = generateImageHash(destPath);

        // Get content details from the blockchain
        const [hash, owner, timestamp] = await getContentDetails(imageHash);

        if (owner !== '0x0000000000000000000000000000000000000000') {
            res.status(200).json({ message: 'Content found', hash, owner, timestamp });
        } else {
            res.status(404).json({ message: 'No content found for the given hash', hash });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        // Clean up the file after processing
        fs.unlinkSync(destPath);
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
    const { contentHash } = req.body;

    try {
        await obtainLicense(contentHash);
        res.status(200).json({ message: 'License obtained successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to pay royalty
router.post('/pay-royalty', async (req, res) => {
    const { contentHash, amount } = req.body;

    try {
        await payRoyalty(contentHash, amount);
        res.status(200).json({ message: 'Royalty paid successfully' });
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

module.exports = router;
