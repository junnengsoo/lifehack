const express = require('express');
const multer = require('multer');
const { registerContent, checkOwnership } = require('../controller/blockchain');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ message: 'Backend is working' });
});

// API to register content
router.post('/register', upload.single('image'), async (req, res) => {
    const filePath = req.file.path;

    try {
        const imageHash = await registerContent(filePath);
        res.status(200).json({ message: 'Content registered successfully', hash: imageHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(filePath); // Clean up uploaded file
    }
});

// API to check ownership
router.post('/check-ownership', upload.single('image'), async (req, res) => {
    const filePath = req.file.path;

    try {
        const { ownerAddress, imageHash } = await checkOwnership(filePath);
        if (ownerAddress !== '0x0000000000000000000000000000000000000000') {
            res.status(200).json({ message: 'Owner found', owner: ownerAddress, hash: imageHash });
        } else {
            res.status(404).json({ message: 'No owner found for the content', hash: imageHash });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(filePath); // Clean up uploaded file
    }
});

module.exports = router;