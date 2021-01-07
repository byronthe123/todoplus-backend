const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
    name: String,
    data: {
        type: Buffer
    },
    contentType: String
}, {
    timestamps: true
});

const Attachment = mongoose.model('Attachment', AttachmentSchema);

module.exports = {
    AttachmentSchema,
    Attachment
};