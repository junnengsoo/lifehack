const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createLicenseTemplate, obtainLicense, payRoyalty, getLicensesForContent, getUserLicenses, getLicensesForTemplate } = require('../controller/licenseManager');
const { registerContent, getContentDetails, getCreatorContents, getAllContents, contentRegistryABI, checkImageSimilarity } = require('../controller/contentRegistry');
// const { checkImageSimilarity } = require('../controller/blockchain');

const Image = require('../models/Image'); // Import the Image model
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

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

    try {
      // Generate hash from the image
        const imageHash = generateImageHash(filePath);

        const destPath = path.join(__dirname, "../uploads/", `${imageHash}.jpg`);

      // Move the file to the desired directory with the hash as its name
      fs.renameSync(filePath, destPath);

      // Register the content on the blockchain
      await registerContent(imageHash);

      res.status(200).json({ message: "Content registered successfully", hash: imageHash });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      // Clean up the file after processing if needed
      // fs.unlinkSync(destPath);
    }
});

// API to get content details
router.post('/content-details', async (req, res) => {
    const { contentHash } = req.body;

    try {
        // Get content details from the blockchain
        const [hash, owner, timestamp] = await getContentDetails(contentHash);
        console.log(hash, owner, timestamp)
        const url = `/uploads/${hash}.jpg`;

        if (owner !== '0x0000000000000000000000000000000000000000') {
            res.status(200).json({ message: 'Content found', hash, owner, timestamp, url });
        } else {
            res.status(404).json({ message: 'No content found for the given hash', hash });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to create a license template
router.post('/create-license-template', async (req, res) => {
    console.log(req.body);
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

// API to get all images
router.get('/images', (req, res) => {
  const files = fs.readdirSync(path.join(__dirname, '../uploads'));

  const images = files
    .filter((file) => fs.statSync(path.join(__dirname, "../uploads", file)).isFile())
    .map((file) => ({
      name: path.parse(file).name,
      url: `/uploads/${file}`, // URL to access the image
    }));
    console.log(images);
  res.status(200).json(images);
});

module.exports = router;
