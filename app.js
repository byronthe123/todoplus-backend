const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const routes = require('./routes');
const PORT = process.env.PORT || 3001;
const helmet = require("helmet");
require('dotenv').config();

const app = express();

// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
}

// mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoplusnext');
const db = mongoose.connection;

app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({extended: true, limit: '16mb'}));

app.use(cors());

app.use(morgan('dev'));
app.use(helmet());

app.use('/api', routes);

// Send every request to the React app
// Define any API routes before this runs
app.get("*", function(req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

app.listen(PORT, () => {
    console.log(`Byron's app is running.`);
});

module.exports = app;