const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createLicenseTemplate, obtainLicense, payRoyalty, getLicensesForContent, getUserLicenses, getLicensesForTemplate } = require('../controller/licenseManager');
const { registerContent, getContentDetails, getCreatorContents, getAllContents, contentRegistryABI } = require('../controller/contentRegistry');
const { checkImageSimilarity } = require('../controller/blockchain');

const Image = require('../models/Image'); // Import the Image model
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

        // Save the image info to the database
        const newImage = new Image({ hash: imageHash, path: destPath });
        await newImage.save();

        res.status(200).json({ message: 'Content registered successfully', hash: imageHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        // Clean up the file after processing
        fs.unlinkSync(destPath);
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

// // API to pay royalty
// router.post('/pay-royalty', async (req, res) => {
//     const { contentHash, licenseIndex, amount } = req.body;

//     try {
//         await payRoyalty(contentHash, licenseIndex, amount);
//         res.status(200).json({ message: 'Royalty paid successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

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
// API to check similarity
router.post('/check-similarity', upload.single('image'), async (req, res) => {
    const filePath = req.file.path;

    try {
        const { mostSimilar, highestSimilarity } = await checkImageSimilarity(filePath);
        if (mostSimilar) {
            res.status(200).json({
                message: 'Most similar image found',
                similarity: highestSimilarity,
                similarImage: mostSimilar
            });
        } else {
            res.status(200).json({ message: 'No similar image found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(filePath); // Clean up uploaded file
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
