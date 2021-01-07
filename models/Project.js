const mongoose = require('mongoose');
const { TaskSchema } = require('./TaskSchema');
const { update } = require('./User');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    completed: {
        type: Boolean,
        default: false
    },
    tasks: [TaskSchema]
}, {
    timestamps: true
});

const getTaskIndex = async (projectId, taskId) => {
    const project = await Project.findById(projectId);
    if (project) {
        const taskIndex = project.tasks.findIndex(t => t._id === taskId);
        return taskIndex;
    }
}

ProjectSchema.statics.addTask = async function(projectId, name) {
    const updatedProject = await Project.findByIdAndUpdate(projectId, 
        {
            $push: {
                'tasks': {
                    name,
                    projectId
                }
            }
        },
        {
            new: true
        }
    );
    if (updatedProject) {
        return updatedProject;
    }
};

ProjectSchema.statics.addSubtask = async function (projectId, taskId, subtask) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        }, 
        {
            $push: {
                'tasks.$.subtasks': subtask
            }
        },
        {
            new: true
        }
    );

    if (updatedProject) {
        console.log(updatedProject);
        return updatedProject;
    }
}

ProjectSchema.statics.updateTask = async function (projectId, taskId, name) {
    const taskIndex = await getTaskIndex(projectId, taskId);
    const query = `tasks.${taskIndex}.name`;
    // const updated = await Project.findByIdAndUpdate(projectId, 
    //     {
    //         $set: {
    //             [query]: name 
    //         }
    //     },
    //     {
    //         new: true
    //     }
    // );

    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        }, 
        {
            $set: {
                'tasks.$.name': name
            }
        },
        {
            new: true
        }
    );

    if (updatedProject) {
        return updatedProject;
    }
};   

ProjectSchema.statics.setDueDate = async function (projectId, taskId, dueDate) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        },
        {
            $set: {
                'tasks.$.dueDate': dueDate
            }
        },
        {
            new: true
        }
    );
    return updatedProject;
};

ProjectSchema.statics.setReminderDate = async function (projectId, taskId, reminderDate) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        },
        {
            $set: {
                'tasks.$.reminderDate': reminderDate
            }
        },
        {
            new: true
        }
    );
    return updatedProject;
};

ProjectSchema.statics.createTaskNote = async function (projectId, taskId, name) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        },
        {
            $push: {
                'tasks.$.notes': {
                    name
                }
            }
        },
        {
            new: true
        }
    );

    if (updatedProject) {
        return updatedProject;
    }
};

ProjectSchema.statics.updateTaskNote = async function (name, projectId, taskId, noteId) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId
        },
        {
            $set: {
                'tasks.$[i].notes.$[j].name': name
            }
        },
        {
            arrayFilters: [
                {
                    'i._id': mongoose.Types.ObjectId(taskId),
                },
                {
                    'j._id': mongoose.Types.ObjectId(noteId)
                }
            ],
            new: true
        },
    );

    if (updatedProject) {
        return updatedProject;
    }
};

ProjectSchema.statics.deleteNote = async function (projectId, taskId, noteId) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        },
        {
            $pull: {
                'tasks.$.notes': {
                    '_id': noteId
                }
            }
        }, 
        {
            new: true
        }
    );

    if (updatedProject) {
        return updatedProject;
    }
};

ProjectSchema.statics.updateSubtask = async function (projectId, taskId, subtaskId, name) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId
        },
        {
            $set: {
                'tasks.$[t].subtasks.$[st].name': name
            }
        },
        {
            arrayFilters: [
                {
                    't._id': mongoose.Types.ObjectId(taskId)
                },
                {
                    'st._id': mongoose.Types.ObjectId(subtaskId)
                }
            ],
            new: true
        }
    );

    if (updatedProject) {
        return updatedProject;
    }
};

ProjectSchema.statics.deleteSubtask = async function (projectId, taskId, subtaskId) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        },
        {
            $pull: {
                'tasks.$.subtasks': {
                    '_id': subtaskId
                }
            }
        },
        {
            new: true
        }
    );

    if (updatedProject) {
        return updatedProject;
    }
};

ProjectSchema.statics.deleteTask = async function (projectId, taskId) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId
        },
        {
            $pull: {
                'tasks': {
                    '._id': taskId
                }
            }
        },
        {
            new: true
        }
    );

    if (updatedProject) {
        return updatedProject;
    }
};

ProjectSchema.statics.completeTask = async function (projectId, taskId, completed) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId,
            'tasks._id': taskId
        },
        {
            $set: {
                'tasks.$.completed': completed
            }
        }, 
        {
            new: true
        }
    );

    if (updatedProject) {
        console.log(updatedProject);
        return updatedProject;
    }
};

ProjectSchema.statics.completeSubtask = async function (projectId, taskId, subtaskId, completed) {
    const updatedProject = await Project.findOneAndUpdate(
        {
            '_id': projectId
        }, 
        {
            $set: {
                'tasks.$[t].subtasks.$[st].completed': completed
            }
        }, 
        {
            arrayFilters: [
                {
                    't._id': mongoose.Types.ObjectId(taskId)
                },
                {
                    'st._id': mongoose.Types.ObjectId(subtaskId)
                }
            ],
            new: true
        }
    );

    if (updatedProject) {
        return updatedProject;
    }
}

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;