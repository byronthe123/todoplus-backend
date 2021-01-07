const mongoose = require('mongoose');
const moment = require('moment');
const { AttachmentSchema } = require('./Attachment');
// const { ProductivityRecord } = require('./index');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    productivityRecords: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductivityRecord'
    }],
    weeklyProductivityGoal:  {
        type: Number,
        default: 0
    }
});

// ---------------------------- User Methods: ---------------------------- //
UserSchema.statics.getUserData = async function(userId) {
    const data = await 
        User.findById(userId)
            .populate('productivityRecords')
            .populate({
                path: 'projects',
                populate: {
                    path: 'tasks.attachments',
                    model: 'Attachment'
                }
            });

    return data;
}

// ---------------------------- Project Methods: ---------------------------- //

UserSchema.statics.addProject = function(id, project, callback) {
    User.findByIdAndUpdate(id, 
        {$push: {projects: project}},
        {new: true},
        (err, doc) => {
            return callback(err, doc);
        });
}

UserSchema.statics.updateProject = function(userId, projectId, name, callback) {
    User.findOneAndUpdate(
        {'_id': userId, 'projects._id': projectId},
        {
            $set: {
                'projects.$.projectName': name
            }
        },
        {new: true}, 
        (err, doc) => {
            return callback(err, doc);
        }
    )
}

UserSchema.statics.completeProject = function(userId, projectId, callback) {
    User.findOneAndUpdate(
        {'_id': userId, 'projects._id': projectId},
        {
            $set: {
                'projects.$.completed': true
            }
        },
        {new: true},
        (err, doc) => {
            return callback(err, doc);
        }
    )
}


UserSchema.statics.addSubtask = function(userID, projectID, taskID, subtask, callback) {
    User.findOneAndUpdate(
        {'_id': userID, 'projects._id': projectID, 'projects.tasks._id': taskID}, 
        {$push: {'projects.$.tasks.0.subtasks': subtask}},
        (err, success) => {
            return callback(err, success);
        }
    )
}

UserSchema.statics.deleteProject = function(userId, projectId, callback) {
    User.findByIdAndUpdate(userId,
        {$pull: {
            projects: {
                _id: projectId
            }
        }},
        {new: true},
        (err, doc) => {
            return callback(err, doc);
        });
}

// ---------------------------- Task Methods: ---------------------------- //

const getTaskIndex = (userId, projectId, taskId, callback) => {
    User.findOne(
        {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId},
        (err, doc) => {
            if(err) {
                console.log(`getTaskIndex Error: `);
                console.log(err);
            }
            console.log(doc);
            const obj = doc.toObject();
            console.log('\n--------------OBJ----------------\n');
            const project = obj.projects.filter((project) => project._id.toString() === projectId.toString())[0];
            console.log(project);
            const index = project.tasks.findIndex((task) => task._id.toString() === taskId.toString());
            console.log(`taskId: ${taskId}`);
            console.log(`index = ${index}`);
            return callback(index);
        }
    )
}

UserSchema.statics.addTask = function(userID, projectID, task, callback) {
    //task = {taskName: req.body.task}
    User.findOneAndUpdate(
        {'_id': userID, 'projects._id': projectID}, 
        {$push: {'projects.$.tasks': task}},
        {new: true},
        (err, doc) => {
            return callback(err, doc);
        }
    )
}

UserSchema.statics.updateTask = function(userId, projectId, taskId, taskName, callback) {
    getTaskIndex(userId, projectId, taskId, (index) => {
        const query = `projects.$.tasks.${index}.taskName`;
        User.findOneAndUpdate(
            {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId},
            {
                $set: {
                    [query]: taskName
                }
            },
            {new: true},
            (err, doc) => {
                return callback(err, doc);
            }
        )
    })
}

UserSchema.statics.completeTask = function(userId, projectId, taskId, callback) {
    getTaskIndex(userId, projectId, taskId, (index) => {
        const query = `projects.$.tasks.${index}.completed`;
        User.findOneAndUpdate(
            {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId},
            {
                $set: {
                    [query]: true
                }
            },
            {new: true},
            (err, doc) => {
                return callback(err, doc);
            }
        )
    })
}

UserSchema.statics.deleteTask = function(userId, projectId, taskId, callback) {
    User.findOneAndUpdate(
        {'_id': userId, 'projects._id': projectId},
        {
            $pull: {
                'projects.$.tasks': {
                    '_id': taskId
                }
            }
        },
        {new: true},
        (err, doc) => {
            return callback(err, doc);
        }
    )
}

UserSchema.statics.setTaskDueDate = function(userId, projectId, taskId, dueDate, callback) {
    getTaskIndex(userId, projectId, taskId, (index) => {
        const query = `projects.$.tasks.${index}.dueDate`;
        User.findOneAndUpdate(
            {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId},
            {
                $set: {
                    [query]: dueDate
                }
            },
            {new: true},
            (err, doc) => {
                return callback(err, doc);
            }
        )
    })
}

UserSchema.statics.updateNote = function(userId, projectId, taskId, note, callback) {
    getTaskIndex(userId, projectId, taskId, (index) => {
        const query = `projects.$.tasks.${index}.note`;
        User.findOneAndUpdate(
            {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId},
            {
                $set: {
                    [query]: note
                }
            },
            {new: true},
            (err, doc) => {
                return callback(err, doc);
            }
        )
    })
}

// ---------------------------- Subtask Methods: ---------------------------- //

const getSubtaskIndex = (userId, projectId, taskId, subtaskId, callback) => {
    console.log(`============================== UPDATED SUBTASK =============================`)
    User.findOne(
        {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId, 'projects.tasks.subtasks._id': subtaskId},
        (err, doc) => {
            const obj = doc.toObject();
            const project = obj.projects.filter((project) => project._id.toString() === projectId.toString())[0];
            const task = project.tasks.filter((task) => task._id.toString() === taskId.toString())[0];
            const subtaskIndex = task.subtasks.findIndex((subtask) => subtask._id.toString() === subtaskId.toString());
            return callback(subtaskIndex);
        }
    )
}   

UserSchema.statics.addSubtask = function(userId, projectId, taskId, subtask, callback) {
    getTaskIndex(userId, projectId, taskId, (taskIndex) => {
        const query = `projects.$.tasks.${taskIndex}.subtasks`;
        User.findOneAndUpdate(
            {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId}, 
            {$push: {[query]: subtask}},
            {new: true},
            (err, success) => {
                return callback(err, success);
            }
        )
    })
}

UserSchema.statics.updateSubtask = function(userId, projectId, taskId, subtaskId, updatedSubtaskName, callback) {
    getTaskIndex(userId, projectId, taskId, (taskIndex) => {
        getSubtaskIndex(userId, projectId, taskId, subtaskId, (subtaskIndex) => {
            const query = `projects.$.tasks.${taskIndex}.subtasks.${subtaskIndex}.subtaskName`;
            User.findOneAndUpdate(
                {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId, 'projects.tasks.subtasks._id': subtaskId},
                {
                    $set: {
                        [query]: updatedSubtaskName
                    }
                },
                {new: true},
                (err, doc) => {
                    return callback(err, doc);
                }
            )
        })
    })
}

UserSchema.statics.completeSubtask = function(userId, projectId, taskId, subtaskId, callback) {
    getTaskIndex(userId, projectId, taskId, (taskIndex) => {
        getSubtaskIndex(userId, projectId, taskId, subtaskId, (subtaskIndex) => {
            const query = `projects.$.tasks.${taskIndex}.subtasks.${subtaskIndex}.completed`;
            User.findOneAndUpdate(
                {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId, 'projects.tasks.subtasks._id': subtaskId},
                {
                    $set: {
                        [query]: true
                    }
                },
                {new: true},
                (err, doc) => {
                    return callback(err, doc);
                }
            )
        })
    })
}

UserSchema.statics.deleteSubtask = function(userId, projectId, taskId, subtaskId, callback) {
    getTaskIndex(userId, projectId, taskId, (taskIndex) => {
        getSubtaskIndex(userId, projectId, taskId, subtaskId, (subtaskIndex) => {
            const query = `projects.$.tasks.${taskIndex}.subtasks`;
            User.findOneAndUpdate(
                {'_id': userId, 'projects._id': projectId, 'projects.tasks._id': taskId, 'projects.tasks.subtasks._id': subtaskId},
                {
                    $pull: {
                        [query]: {
                            '_id': subtaskId
                        }
                    }
                },
                {new: true},
                (err, doc) => {
                    return callback(err, doc);
                }
            )
        })
    })
}



// ---------------------------- ProductivityRecord Methods: ---------------------------- //
// UserSchema.methods.checkProductivityRecord = function () {
//     const today = moment().startOf('day');
//     const { productivityRecords } = this;
//     const latestRecord = productivityRecords[productivityRecords.length - 1];
//     console.log(productivityRecords);
//     return moment(latestRecord.createdAt).isBetween(moment(today).startOf('day'), moment(today).endOf('day'));
// }

UserSchema.statics.checkProductivityRecord = async function(userId) {

    const today = moment().startOf('day');

    const productivityRecordExists = await User.aggregate([
        {
            $lookup: {
                from: 'productivityrecords',
                localField: 'productivityRecords',
                foreignField: '_id',
                as: 'productivityObjects'
            }
        },
        {
            $match: {
                '_id': userId,
                'productivityObjects.createdAt': {
                    "$gte": today.toDate(), "$lt": moment(today).endOf('day').toDate()
                }
            }
        },
        {
            $unwind: '$productivityObjects'
        }
    ]);

    return productivityRecordExists.length > 0;
};


// UserSchema.statics.checkProductivityRecord = function(userId, callback) {

//     const today = moment().startOf('day');

//     User.findOne(
//         {'_id': userId, 
//         'productivityRecords.date': {
//             "$gte": today.toDate(), "$lt": moment(today).endOf('day').toDate()
//         }},
//         (err, doc) => {
//             if(!doc) {
//                 User.addProductivityRecord(userId, (err, doc) => {
//                     console.log(`new productivityRecord created`);
//                     return callback(err, doc);
//                 });
//             } else {
//                 console.log('existing productivityRecord found');
//                 return callback(doc);
//             }
//         }
//     )
// }

// ASSUMES THAT THERE WILL BE A PRODUCTIVITY RECORD
UserSchema.statics.getTodaysProductivityRecordId = function(userId, callback) {
    const today = moment().startOf('day');

    User.findOne(
        {'_id': userId, 
        'productivityRecords.date': {
            "$gte": today.toDate(), "$lt": moment(today).endOf('day').toDate()
        }},
        (err, doc) => {
            if(err) {
                console.log(err);
            }
            // doc.productivityRecords.map((record) => console.log(record.date));
            // console.log(today.toDate());
            // doc.productivityRecords.map((record) => console.log(record.date >= today.toDate() && record.date <= moment(today).endOf('day').toDate()));
            const productivityRecordId = doc.productivityRecords.filter((record) => record.date >= today.toDate() && record.date <= moment(today).endOf('day').toDate())[0]._id;
            // console.log(doc.productivityRecords.filter((record) => record.date >= today.toDate() && record.date <= moment(today).endOf('day').toDate())[0]._id);
            console.log(productivityRecordId);
            return callback(productivityRecordId);
        }
    )
}

UserSchema.statics.addProductivityRecord = function(userId, callback) {
    User.findByIdAndUpdate(userId, 
        {
            $push: {
                productivityRecords: {
                    
                }
            }
        },
        {new: true}, 
        (err, doc) => {
            console.log('new productivity record created');
            console.log(doc);
            return callback(err, doc);
        })
}

UserSchema.statics.checkProductivityEntry = function(userId, taskId, taskName, callback) {
    User.getTodaysProductivityRecordId(userId, (productivityRecordId) => {
        User.findOne(
            {'_id': userId, 'productivityRecords._id': productivityRecordId},
            (err, doc) => {
                const data = doc.toObject();
                const record = data.productivityRecords.filter((record) => record._id.toString() === productivityRecordId.toString())[0];
                const entry = record.entries.filter((entry) => entry.taskId.toString() === taskId.toString())[0];
                if(entry === undefined) {
                    User.addProductivityEntry(userId, taskId, taskName, (err, doc) => {
                        return callback(err, doc);
                    });
                } else {
                    return callback(err, doc);
                }
            }
        )
    })
}

UserSchema.statics.updateEntryTime = function(userId, taskId, taskName, callback) {
    User.getTodaysProductivityRecordId(userId, (productivityRecordId) => {
        User.checkProductivityEntry(userId, taskId, taskName, (err, doc) => {
            User.getProductivityEntryInfo(userId, taskId, (entry) => {
                const query = `productivityRecords.$.entries.${entry.index}.productiveTime`;
                User.findOneAndUpdate(
                    {'_id': userId, 'productivityRecords._id': productivityRecordId, 'productivityRecords.entries._id': entry._id},
                    {
                        $set: {
                            [query]: entry.currentProductiveTime += 1500
                        }
                    },
                    {new: true},
                    (err, doc) => {
                        return callback(err, doc);
                    }
                )
            });
        })
    })
}

UserSchema.statics.addProductivityEntry = function(userId, taskId, taskName, callback) {
    User.getTodaysProductivityRecordId(userId, productivityRecordId => {
        User.findOneAndUpdate(
            {'_id': userId, 'productivityRecords._id': productivityRecordId},
            {
                $push: {
                    'productivityRecords.$.entries': {
                        taskId,
                        taskName
                    }
                }
            },
            {new: true},
            (err, doc) => {
                return callback(err, doc);
            }
        )
    });
}

UserSchema.statics.getProductivityEntryInfo = function(userId, taskId, callback) {
    User.getTodaysProductivityRecordId(userId, (productivityRecordId) => {
        User.findOne(
            {'_id': userId, 'productivityRecords._id': productivityRecordId},
            (err, doc) => {
                const data = doc.toObject();
                const record = data.productivityRecords.filter((record) => record._id.toString() === productivityRecordId.toString())[0];
                const foundEntry = record.entries.filter((entry) => entry.taskId.toString() === taskId.toString())[0];
                const foundEntryIndex = record.entries.findIndex((entries) => entries._id.toString() === foundEntry._id.toString());
                const entry = {
                    _id: foundEntry._id,
                    index: foundEntryIndex,
                    currentProductiveTime: foundEntry.productiveTime
                }
                return callback(entry);
            }
        )
    })
}

UserSchema.statics.getTodaysProductiveInfo = function(userId, callback) {
    User.getTodaysProductivityRecordId(userId, (todaysProductivityRecordId) => {
        User.getDaysProductiveInfo(userId, todaysProductivityRecordId, (err, todaysProductiveInfo) => {
            return callback(err, todaysProductiveInfo);
        })
    })
}

UserSchema.statics.updateTodaysProductiveTime = function(userId, callback) {
    User.getTodaysProductivityRecordId(userId, (todaysProductivityRecordId) => {
        User.getDaysProductiveTime(userId, todaysProductivityRecordId, (err, todaysProductiveTime) => {
            User.findOneAndUpdate(
                {'_id': userId, 'productivityRecords._id': todaysProductivityRecordId},
                {
                    $set: {
                        'productivityRecords.$.productivityAchieved': todaysProductiveTime
                    }
                },
                {new: true},
                (err, doc) => {
                    return callback(err, doc);
                }
            )
        })
    })
}

UserSchema.statics.getDaysProductiveTime = function(userId, productivityRecordId, callback) {
    User.findOne(
        {'_id': userId},
        (err, doc) => {
            const data = doc.toObject();
            const record = data.productivityRecords.filter((record) => record._id.toString() === productivityRecordId.toString())[0];
            const daysProductiveTime = record.entries.reduce((totalTime, entry) => {
                return totalTime += entry.productiveTime;
            }, 0);
            return callback(err, daysProductiveTime);
        }
    )
}

UserSchema.statics.setProductivityGoal = function(userId, productivityGoalSeconds, callback) {
    User.getTodaysProductivityRecordId(userId, (todaysProductivityRecordId) => {
        User.findOneAndUpdate(
            {'_id': userId, 'productivityRecords._id': todaysProductivityRecordId},
            {
                $set: {
                    'productivityRecords.$.productivityGoal': productivityGoalSeconds
                }
            },
            {new: true},
            (err, doc) => {
                if(err) {
                    console.log(err)
                }
                console.log(doc);
                return callback(err, doc);
            }
        )
    })
}

UserSchema.statics.setWeeklyProductivityGoal = function(userId, weeklyProductivityGoalSeconds, callback) {
    User.findOneAndUpdate(
        {'_id': userId},
        {
            $set: {
                'weeklyProductivityGoal': weeklyProductivityGoalSeconds
            }
        },
        {new: true},
        (err, doc) => {
            if(err) {
                console.log(err)
            }
            console.log(doc);
            return callback(err, doc);
        }
    )
}

// setWeeklyProductivityGoal

// Stats:
UserSchema.statics.getStats = function(userId, range, callback) {
    User.findById(userId, (err, doc) => {
        if(!err && doc) {
            const {productivityRecords} = doc;
            const weekDates = [];
            const stats = [];

            for(let i = 0; i < range; i++) {
                weekDates.push(moment().subtract(i, 'days').format('L'));
            }

            for(let i = 0; i < weekDates.length; i++) {
                // console.log(weekDates[i]);
                const stat = {
                  date: weekDates[i]
                };
              
                for(let j = (productivityRecords.length - 1); j > (productivityRecords.length - range); j--) {
                  if(productivityRecords[j]) {
                    if(moment(productivityRecords[j].date).format('L') === weekDates[i]) {
                        console.log(`${moment(productivityRecords[j].date).format('L')} === ${weekDates[i]} = ${moment(productivityRecords[j].date).format('L') === weekDates[i]}`);
                      stat.productivityData = productivityRecords[j];
                    }
                  }
                }

                stats.push(stat);
            }
            return callback(null, stats);
        } else {
            return callback(err, null);
        }
    });
}

const User = mongoose.model('User', UserSchema);

module.exports = User;