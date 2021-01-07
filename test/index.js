const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const yup = require('yup');
const app = require('../app');
const moment = require('moment');
const { User, ProductivityRecord, Project } = require('../models/index');
const { 
    userDataSchema, 
    projectSchema, 
    taskSchema, 
    subtaskSchema,
    productivityRecordSchema,
    entrySchema 
} = require('../testData/index');

chai.use(chaiHttp);
chai.use(chai => {
    const { Assertion } = chai;
    Assertion.addMethod("yupSchema", function validate(expectedSchema) {
        const obj = this._obj;
        new Assertion(() => expectedSchema.validateSync(obj)).not.to.throw();
    });
});

describe('/PUT /api/project/task/subtask/complete', () => {

    const data = {
        projectId: '5ff25236e0033162e0e8ffe4',
        taskId: '5ff252bfe0033162e0e8ffe5',
        subtaskId: '5ff25347db488823582a8bf7',
        completed: true
    };

    it(`it should update the Project's complete prop and return the updated Project`, async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/task/subtask/complete')
                .send({ data });
        
        const { body } = res;
        const updatedTask = body.tasks.find(t => t._id === data.taskId);
        const updatedSubtask = updatedTask.subtasks.find(st => st._id === data.subtaskId);

        expect(res).to.have.status(200);
        expect(updatedSubtask.completed).to.equal(data.completed);
    }).timeout(10000);
});

//completeTask

