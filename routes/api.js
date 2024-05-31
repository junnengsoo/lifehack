const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { registerContent, checkOwnership } = require('../controller/contentRegistry');

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
    } 
    // finally {
    //     // Clean up the file after processing
    //     fs.unlinkSync(destPath);
    // }
});

// API to check ownership
router.post('/check-ownership', upload.single('image'), async (req, res) => {
    const filePath = req.file.path;
    const destPath = path.join(__dirname, '../uploads/', req.file.filename);

    try {
        // Move the file to the desired directory
        fs.renameSync(filePath, destPath);

        // Generate hash from the image
        const imageHash = generateImageHash(destPath);

        // Check ownership on the blockchain
        const { ownerAddress } = await checkOwnership(imageHash);

        if (ownerAddress !== '0x0000000000000000000000000000000000000000') {
            res.status(200).json({ message: 'Owner found', owner: ownerAddress, hash: imageHash });
        } else {
            res.status(404).json({ message: 'No owner found for the content', hash: imageHash });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } 
    // finally {
    //     // Clean up the file after processing
    //     fs.unlinkSync(destPath);
    // }
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
