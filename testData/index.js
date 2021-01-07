const yup = require('yup');

module.exports = {

    userDataSchema: yup.object().shape({
        projects: yup.array().defined(),
        productivityRecords: yup.array().required(),
        weeklyProductivityGoal: yup.number().required(),
        _id: yup.string().required(),
        email: yup.string().required()
    }),

    projectSchema: yup.object().shape({
        completed: yup.boolean().required(),
        _id: yup.string().required(),
        name: yup.string().required(),
        tasks: yup.array().defined(),
        createdAt: yup.date().required(),
        updatedAt: yup.date().required()
    }),

    taskSchema: yup.object().shape({
        _id: yup.string().required(),
        name: yup.string().required(),
        completed: yup.boolean().required(),
        dueDate: yup.date().notRequired(),
        notes: yup.array().defined(),
        subtasks: yup.array().defined(),
        createdAt: yup.date().required(),
        updatedAt: yup.date().required(),
        projectId: yup.string().required()
    }),

    taskSchema: yup.object().shape({
        _id: yup.string().required(),
        name: yup.string().required(),
        completed: yup.boolean().required(),
        dueDate: yup.date().notRequired(),
        notes: yup.string().defined(),
        subtasks: yup.array().defined(),
        createdAt: yup.date().required(),
        updatedAt: yup.date().required()
    }),

    subtaskSchema: yup.object().shape({
        _id: yup.string().required(),
        name: yup.string().required(),
        completed: yup.boolean().required(),
        // createdAt: yup.date().required(),
        // updatedAt: yup.date().required()
    }),

    productivityRecordSchema: yup.object().shape({
        _id: yup.string().required(),
        productivityGoal: yup.number().required(),
        productivityAchieved: yup.number().required(),
        entries: yup.array().defined(),
        createdAt: yup.date().required(),
        updatedAt: yup.date().required()
    }),

    entrySchema: yup.object().shape({
        productiveTime: yup.string().required(),
        task: yup.object().required()
    })
}
