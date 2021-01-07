const { User, ProductivityRecord, Project } = require('../models/index');
const { asyncHandler } = require('../utils/index');

module.exports = {
    createProductivityRecord: async (userId) => {
        const record = await ProductivityRecord.create({ });

        await User.findByIdAndUpdate(userId, {
            $push: {
                'productivityRecords': record._id
            }
        });
    },

    getPopulatedProject: async (projectId) => {
        const updatedProject = await 
        Project.findById(projectId)
               .populate({
                    path: 'tasks.attachments',
                    model: 'Attachment'
               });
        
        return updatedProject;
    }
}