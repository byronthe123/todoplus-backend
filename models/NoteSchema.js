const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    name: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = NoteSchema;