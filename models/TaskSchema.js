const mongoose = require('mongoose');
const { taskSchema } = require('../testData');
const SubtaskSchema = require('./SubtaskSchema');
const NoteSchema = require('./NoteSchema');

const TaskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    completed: {
        type: Boolean,
        default: false
    },
    dueDate: {
        type: Date
    },
    reminderDate: {
        type: Date
    },
    notes: [NoteSchema],
    subtasks: [SubtaskSchema],
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    attachments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attachment'
    }]
}, {
    timestamps: true
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = {
    TaskSchema,
    Task
};