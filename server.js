// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const apiRoutes = require('./routes/api');
const app = express();
const port = 3001;

<<<<<<< HEAD
// MongoDB setup
// mongoose.connect('mongodb://localhost:27017/lifehack', { useNewUrlParser: true, useUnifiedTopology: true });
=======

>>>>>>> fcfecc0f4e57cd9c2a81b4ee9eff6ce671387633

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
