// models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filePath: { type: String, required: true },
    hash: { type: String, required: true },
});

module.exports = mongoose.model('Image', imageSchema);
