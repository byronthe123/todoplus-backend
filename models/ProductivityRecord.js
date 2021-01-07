const mongoose = require('mongoose');
const EntrySchema = require('./EntrySchema');

const ProductivityRecordSchema = new mongoose.Schema({
    productivityGoal: {
        type: Number,
        required: true,
        default: 0
    },
    productivityAchieved: {
        type: Number,
        default: 0
    },
    entries: [EntrySchema]
}, {
    timestamps: true
});

ProductivityRecordSchema.statics.addEntry = async function (productivityRecordId, task) {
    const updated = await ProductivityRecord.findOneAndUpdate(
        {
            _id: productivityRecordId
        },
        {
            $inc: {
                productivityAchieved: 1500
            },
            $push: {
                'entries': {
                    task
                }
            }
        },
        {
            new: true
        }
    );
    return updated;
}

const ProductivityRecord = mongoose.model('ProductivityRecord', ProductivityRecordSchema);


// export
module.exports = ProductivityRecord;