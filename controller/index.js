const db = require('../models/index');
const moment =  require('moment');
const yup = require('yup');
const notifier = require('node-notifier');
const path = require('path');
const { User, Project, ProductivityRecord, Attachment } = db;
const utils  = require('../utils/index');
const { asyncHandler } = utils;
const { createProductivityRecord } = require('../helper/index');
const helper = require('../helper/index');

module.exports = {
    userData: asyncHandler(async(req, res) => {
        const { email } = req.body;

        const user = await User.findOne({
            email
        });

        if (user) {
            const userId = user._id;
            const prodictivityRecordExists = await User.checkProductivityRecord(userId);

            if (prodictivityRecordExists) {
                const data = await User.getUserData(userId);
                return res.json(data);
            } else {
                await createProductivityRecord(userId);
                const data = await User.getUserData(userId);
                console.log(data);
                return res.json(data);
            }
        } else {
            const createdUser = await User.create({
                email
            });

            if (createdUser) {
                const userId = createdUser._id;
                await createProductivityRecord(userId);
                const data = await User.getUserData(userId);
                return res.json(data);
            }
        }
    }),

    addProject: asyncHandler(async(req, res) => {
        const { name, userId } = req.body.data;

        const project = await Project.create({ name });

        if (project) {
            const updatedUser = await User.findByIdAndUpdate(userId, {
                $push: {
                    'projects': project._id
                }
            });

            const populatedProject = await helper.getPopulatedProject(project._id);

            return res.json(populatedProject);
        }
    }),

    deleteProject: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId } = req.body.data;
            await Project.findByIdAndDelete(projectId);
            return res.sendStatus(200);
        }
    }),

    updateProject: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            name: yup.string().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, name } = req.body.data;
            await Project.findOneAndUpdate(
                {
                    '_id': projectId
                }, 
                {
                    $set: {
                        name 
                    }
                },
                {
                    new: true
                }
            );

            const populatedProject = await helper.getPopulatedProject(projectId); 

            return res.json(populatedProject);
        }
    }),

    completeProject: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            completed: yup.boolean().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, completed } = req.body.data;
            await Project.findOneAndUpdate(
                {
                    '_id': projectId
                },
                {
                    $set: {
                        completed
                    }
                },
                {
                    new: true
                }
            );

            const populatedProject = await helper.getPopulatedProject(projectId); 

            return res.json(populatedProject);        
        }
    }),

    addTask: asyncHandler(async(req, res) => {
        const { projectId, name } = req.body.data;
        await Project.addTask(projectId, name);
        const populatedProject = await helper.getPopulatedProject(projectId); 
        return res.json(populatedProject);
    }),

    updateTask: asyncHandler(async(req, res) => {
        console.log(req.body.data);
        const { projectId, taskId, name } = req.body.data;
        await Project.updateTask(projectId, taskId, name);
        const populatedProject = await helper.getPopulatedProject(projectId); 
        return res.json(populatedProject);
    }),

    deleteTask: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId } = req.body.data;
            await Project.deleteTask(projectId, taskId);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    setTaskDueDate: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            dueDate: yup.date().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, dueDate } = req.body.data;
            await Project.setDueDate(projectId, taskId, dueDate);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    setReminderDate: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            reminderDate: yup.date().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, reminderDate } = req.body.data;
            await Project.setReminderDate(projectId, taskId, reminderDate);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    addSubtask: asyncHandler(async(req, res) => {
        const { projectId, taskId, name } = req.body.data;
        const subtask = {
            name
        }
        await Project.addSubtask(projectId, taskId, subtask);
        const populatedProject = await helper.getPopulatedProject(projectId); 
        return res.json(populatedProject);
    }),

    completeTask: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            completed: yup.boolean().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, completed } = req.body.data;
            await Project.completeTask(projectId, taskId, completed);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    updateSubtask: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            subtaskId: yup.string().required(),
            name: yup.string().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, subtaskId, name } = req.body.data;
            await Project.updateSubtask(projectId, taskId, subtaskId, name);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    completeSubtask: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            subtaskId: yup.string().required(),
            completed: yup.boolean().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, subtaskId, completed } = req.body.data;
            await Project.completeSubtask(projectId, taskId, subtaskId, completed);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    deleteSubtask: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            subtaskId: yup.string().required(),
        });  

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, subtaskId } = req.body.data;
            await Project.deleteSubtask(projectId, taskId, subtaskId);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    updateEntryProductiveTime: (req, res) => {
        db.updateEntryTime(req.body._id, req.body.taskId, req.body.taskName, (err, doc) => {
            if(err) {
                console.log(err);
                return res.json(err);
            }
            console.log(doc);
            return res.json(doc);
        })
    },

    updateTodaysProductiveTime: (req, res) => {
        db.updateTodaysProductiveTime(req.body._id, (err, doc) => {
            if(err) {
                console.log(err);
                return res.json(err);
            }
            // notifier.notify({
            //     'title': 'To Do Plus',
            //     'message': 'You completed a productivity session!',
            //     'icon': path.join(__dirname, '../client/public/assets/images/concept2small.png'),
            //     'contentImage': path.join(__dirname, '../client/public/assets/images/concept2small.png')
            // });
            return res.json(doc);
        });
    },

    setProductivityGoal: asyncHandler(async(req, res) => {
        const reqBodyDataSchema = yup.object().shape({
            productivityRecordId: yup.string().required(),
            productivityGoal: yup.number().required().min(1)
        });

        const validReqBodyData = await reqBodyDataSchema.validate(req.body.data);

        if (validReqBodyData) {
            const { productivityRecordId, productivityGoal } = req.body.data;
            const updatedRecord = await ProductivityRecord.findByIdAndUpdate(productivityRecordId, {
                productivityGoal
            }, {
                new: true
            });
    
            if (updatedRecord) {
                return res.json(updatedRecord);
            }
        }
    }),

    setWeeklyProductivityGoal: asyncHandler(async(req, res) => {
        const reqBodyDataSchema = yup.object().shape({
            _id: yup.string().required(),
            weeklyProductivityGoal: yup.number().required()
        });

        const validReqData = await reqBodyDataSchema.validate(req.body.data);

        if (validReqData) {
            const { data } = req.body;
            const { _id, weeklyProductivityGoal } = data;
            const updated = await User.findByIdAndUpdate(_id, {
                weeklyProductivityGoal
            });

            if (updated) {
                return res.sendStatus(200);
            }
        }
    }),

    createProductivityEntry: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            productivityRecordId: yup.string().required(),
            task: yup.object().required()
        });

        const validData = await dataSchema.validate(req.body.data);
        if (validData) {
            const { productivityRecordId, task } = req.body.data;
            const updated = await ProductivityRecord.addEntry(productivityRecordId, task);
            notifier.notify({
                title: "To Do Plus",
                message: "You completed a productivity session!",
                wait: true,
                icon: path.join(__dirname, '../icon.png'),
            });
            return res.json(updated);
        };
    }),

    // createProductivityEntry: asyncHandler(async(req, res) => {
    //     notifier.notify({
    //         title: "To Do Plus",
    //         message: "You completed a productivity session!",
    //         wait: true,
    //         icon: path.join(__dirname, '../icon.png'),
    //     });
    //     return res.sendStatus(200);
    // }),

    createTaskNote: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            name: yup.string().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, name } = req.body.data;
            await Project.createTaskNote(projectId, taskId, name);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    updateNote: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            name: yup.string().required(),
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            noteId: yup.string().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { name, projectId, taskId, noteId } = req.body.data;
            await Project.updateTaskNote(name, projectId, taskId, noteId);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    deleteNote: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            noteId: yup.string().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {
            const { projectId, taskId, noteId } = req.body.data;
            await Project.deleteNote(projectId, taskId, noteId);
            const populatedProject = await helper.getPopulatedProject(projectId); 
            return res.json(populatedProject);
        }
    }),

    saveAttachments: asyncHandler(async(req, res) => {
        const dataSchema = yup.object().shape({
            projectId: yup.string().required(),
            taskId: yup.string().required(),
            attachments: yup.array().required()
        });

        const validData = await dataSchema.validate(req.body.data);

        if (validData) {

            const { projectId, taskId, attachments } = req.body.data;
            const attachmentPromises = [];
            const savedAttachmentIds = [];

            for (let i = 0; i < attachments.length; i++) {
                const { name, base64, type } = attachments[i];
                const writeBase64 = base64.split(';base64,').pop();
                attachmentPromises.push(
                    Attachment.create({
                        name,
                        data: writeBase64,
                        contentType: type
                    }).then((doc, err) => {
                        if (err) {
                            throw err;
                        }
                        savedAttachmentIds.push(doc._id);
                    })
                );
            }

            await Promise.all(attachmentPromises);

            const updateProjectPromises = [];

            for (let i = 0;  i < savedAttachmentIds.length; i++) {
                const currentId = savedAttachmentIds[i];

                updateProjectPromises.push(
                    await Project.findOneAndUpdate(
                        {
                            '_id': projectId,
                            'tasks._id': taskId
                        },
                        {
                            $push: {
                                'tasks.$.attachments': currentId
                            }
                        }
                    )
                );
            }

            await Promise.all(updateProjectPromises);

            const updatedProject = await helper.getPopulatedProject(projectId);

            return res.json(updatedProject);

        }
    }),
}