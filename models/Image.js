const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    hash: String,
    path: String
});

module.exports = mongoose.model('Image', imageSchema);
