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

// mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoplusnext');
const db = mongoose.connection;

app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({extended: true, limit: '16mb'}));

app.use(cors());

app.use(morgan('dev'));
app.use(helmet());

app.use('/api', routes);

app.listen(PORT, () => {
    console.log(`Byron's app is running.`);
});

module.exports = app;