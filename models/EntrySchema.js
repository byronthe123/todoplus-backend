const mongoose = require('mongoose');
const { TaskSchema } = require('./TaskSchema');

const EntrySchema = new mongoose.Schema({
    task: TaskSchema,
    productiveTime: {
        type: Number,
        default: 1500
    }
});

module.exports = EntrySchema;