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

const generateRandomNum = () => Math.floor((Math.random() * 1000) + 1);

const generateRandomEmail = () => {
    return `testcase${generateRandomNum()}@gmail.com`;
}

const generateProjectTask = async () => {
    const project = await Project.create({
        name: `Test project ${generateRandomNum()}`
    });

    project.tasks.push({
        name: `Test task ${generateRandomNum()}`,
        projectId: project._id
    });

    await project.save();

    return project;
}

describe('/POST /api/userData', () => {

    // before(async () => {
    //     User.findOneAndRemove({
    //         where: {
    //             email: '3rag0nshadeslayer@gmail.com'
    //         }
    //     });

    //     await User.create({
    //         email: '3rag0nshadeslayer@gmail.com'
    //     });
    // });

    it(`it should return the user's data if the user exists`, async () => {
        const res = await 
            chai.request(app)
                .post('/api/userData')
                .set({ Authorization: `Bearer testing` })
                .send({ email: '3rag0nshadeslayer@gmail.com' });

        expect(res).to.have.status(200);
        expect(res.body).to.be.a.yupSchema(userDataSchema);
    }).timeout(10000);

    it(`should create a new user and return it's data if no user exists`, async () => {
        const res = await chai
            .request(app)
            .post(`/api/userData`)
            .set({ Authorization: `Bearer test` })
            .send({ email: generateRandomEmail() });

        expect(res).to.have.status(200);
        expect(res.body).to.be.a.yupSchema(userDataSchema);
    }).timeout(10000);
});

describe('/POST /api/addProject', () => {
    const data = {};

    before(async () => {

        const random = Math.floor((Math.random() * 100) + 1);

        const user = await User.create({
            email: generateRandomEmail()
        }); 

        data.userId = user._id;
        data.name = 'Project 1';
    });

    it(`should create a new project, add the project._id to the user's projects array, return the created project`, async () => {
        const res = await 
            chai.request(app)
                .post('/api/addProject')
                .send({ data });

        expect(res).have.status(200);
        expect(res.body).to.be.a.yupSchema(projectSchema);

        const user = await User.findById(data.userId);
        const createdProjectId = res.body._id;
        const { projects } = user;
        const foundProject = projects.find(p => p.toString() === createdProjectId.toString());
        expect(foundProject).to.not.equal(undefined);
    }).timeout(10000);
});

describe('/POST /project/addTask', () => {
    const data = {};

    before(async () => {
        const project = await Project.create({
            name: 'Test case project'
        });

        data.name = 'Test case task';
        data.projectId = project._id;
    });

    it(`it should add a task to the specified project and return the updated project`, async () => {
        const res = await 
            chai.request(app)
                .post('/api/project/addTask')
                .send({ data });

        const { tasks } = res.body;
        expect(res).to.have.status(200);
        const addedTask = tasks.find(t => t.name === data.name);
        expect(addedTask).to.not.be.undefined;
        expect(addedTask).to.be.a.yupSchema(taskSchema);
        expect(addedTask.projectId).to.equal(data.projectId.toString());
    }).timeout(10000);
});

describe('/POST /api/project/task/addSubtask', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();

        data.name = 'Test subtask 1';
        data.projectId = project._id;
        data.taskId = project.tasks[0]._id;
    });

    it('it should create a subtask in projects[id] -> tasks[id] -> subtasks and return the created subtask', async () => {
        const res = await
            chai.request(app)
                .post('/api/project/task/addSubtask')
                .send({ data });

        const updatedProject = res.body; // body = updatedProject
        const updatedTask = updatedProject.tasks.find(t => t._id === data.taskId.toString());
        const createdSubtask = updatedTask.subtasks.find(st => st.name === data.name);
        
        expect(res).to.have.status(200);
        expect(createdSubtask).to.not.be.undefined;
        expect(createdSubtask).to.be.a.yupSchema(subtaskSchema);
    }).timeout(10000);
});

describe('/PUT /user/setWeeklyProductivityGoal', () => {

    it(`It should throw a 400 error is data is missing from the req.body.data`, async () => {
        const data = {
            _id: ''        
        };
        
        const res = await 
            chai.request(app)
                .put('/api/user/setWeeklyProductivityGoal')
                .send({ data });

        expect(res).to.have.status(400);

    }); 

    const data = {};

    before(async () => {
        const user = await User.create({
            email: generateRandomEmail()
        });

        data._id = user._id;
        data.weeklyProductivityGoal = 56;
    });

    it(`It should update the user's weeklyProductivityGoal goal.`, async () => {

        const res = await
            chai.request(app)
                .put('/api/user/setWeeklyProductivityGoal')
                .send({ data });

        expect(res).to.have.status(200);
        const user = await User.findById(data._id);
        expect(user.weeklyProductivityGoal).to.equal(data.weeklyProductivityGoal);

    }).timeout(10000);
});

describe('/PUT /user/setProductivityGoal', () => {
    const data = {};

    before(async () => {
        const record = await ProductivityRecord.create({
            productivityGoal: 0
        });
        data.productivityRecordId = record._id;
        data.productivityGoal = 14400;
    });

    it(`it should update the productivityGoal of the user's current productivityRecord and return the record`, async () => {
        const res = await 
            chai.request(app)
                .put('/api/user/setProductivityGoal')
                .send({ data });

        const { body } = res;
        const { _id, productivityGoal } = body;
        expect(res).to.have.status(200);
        expect(body).to.be.a.yupSchema(productivityRecordSchema); 
        expect(_id).to.equal(data.productivityRecordId.toString());
        expect(parseInt(productivityGoal)).to.equal(parseInt(data.productivityGoal));

    }).timeout(10000);
}); 

describe('/PUT /api/project/task/update', () => {
    const data = {};

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id;
        data.taskId = project.tasks[0]._id;
        data.name = `Updated task ${generateRandomNum()}`
    });

    it(`it should update the project's task's name and return the updated project`, async () => {
        
        const res = await
            chai.request(app)
                .put('/api/project/task/update')
                .send({ data });
        
        const { body } = res;
        const { _id, tasks } = body;
        expect(res).to.have.status(200);
        expect(body).to.be.a.yupSchema(projectSchema);
        expect(_id).to.equal(data.projectId.toString());
        const updatedTask = tasks.find(t => t._id === data.taskId.toString());
        expect(updatedTask.name).to.equal(data.name);

    }).timeout(10000);
});

describe('/POST /api/productivityRecord/createProductivityEntry', () => {

    const data = {
        productivityRecordId: '',
        task: {
            completed: false,
            _id: "5fc446914bb87a542855a005",
            name:"task 1",
            updatedAt: new Date(),
            createdAt: new Date(),
            subtasks:[
               
            ]
        },
    };

    before(async () => {
        const record = await ProductivityRecord.create({
            productivityGoal: 4444,
            productivityAchieved: 12
        });
        data.productivityRecordId = record._id;
    });

    it('it should update the productivityAchieved and return the updated record', async () => {

        // Get the previous productivityAchieved:
        const productivityRecord = await ProductivityRecord.findById(data.productivityRecordId);
        const previousProductivityAchieved = productivityRecord.productivityAchieved;

        const res = await 
            chai.request(app)
                .post('/api/productivityRecord/createProductivityEntry')
                .send({ data });

        const { body } = res;
        expect(res).to.have.status(200);
        expect(body._id).to.equal(data.productivityRecordId.toString());
        expect(body.productivityAchieved).to.equal(previousProductivityAchieved + 1500);

    }).timeout(10000);

    it('it should create an entry in entries and return the new record', async () => {
        const res = await 
            chai.request(app)
                .post('/api/productivityRecord/createProductivityEntry')
                .send({ data });

        const { body } = res;
        const { entries } = body;
        const foundEntry = entries.find(e => e.task._id === data.task._id);
        const createdEntry = entries[entries.length - 1];

        expect(res).to.have.status(200);
        expect(body._id).to.equal(data.productivityRecordId.toString());
        expect(foundEntry).to.not.equal(null);
        expect(foundEntry).to.not.equal(undefined);
        expect(createdEntry.task._id).to.equal(data.task._id);
        expect(createdEntry).to.be.a.yupSchema(entrySchema);
        expect(createdEntry.productiveTime).to.equal(1500);

    }).timeout(10000);
});

describe('/PUT /project/task/setDueDate', () => {
    const data = {};  

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id;
        data.taskId = project.tasks[0]._id;
        data.dueDate = moment().format('MM/DD/YYYY HH:mm');
    });

    it(`it should set the due date of the Project's Task and return the Project`, async () => {
        const res = await 
            chai.request(app)
                .put(`/api/project/task/setDueDate`)
                .send({ data });

        const { body } = res;
        expect(res).to.have.status(200);
        // expect(res).to.be.a.yupSchema(projectSchema);
        expect(body._id).to.equal(data.projectId.toString());
        const task = body.tasks.find(t => t._id === data.taskId.toString());
        expect(
            moment(task.dueDate).format('MM/DD/YYYY HH:mm')
        ).to.equal(
            moment(data.dueDate).format('MM/DD/YYYY HH:mm')
        );
    }).timeout(10000);
});

describe('/PUT /project/task/setReminderDate', () => {

    const data = {};  

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id;
        data.taskId = project.tasks[0]._id;
        data.reminderDate = moment().format('MM/DD/YYYY HH:mm');
    });

    it(`it should set the reminder date of the Project's Task and return the Project`, async () => {
        const res = await 
            chai.request(app)
                .put(`/api/project/task/setReminderDate`)
                .send({ data });

        const { body } = res;
        expect(res).to.have.status(200);
        // expect(res).to.be.a.yupSchema(projectSchema);
        expect(body._id).to.equal(data.projectId.toString());
        const task = body.tasks.find(t => t._id === data.taskId.toString());
        console.log(`------------------- ${task.reminderDate.toString()} --------------`);
        expect(
            moment(task.reminderDate).format('MM/DD/YYYY HH:mm')
        ).to.equal(
            moment(data.reminderDate).format('MM/DD/YYYY HH:mm')
        );
    }).timeout(10000);
});

describe('/POST /api/project/task/createTaskNote', () => {
    const data = {};

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id.toString();
        data.taskId = project.tasks[0]._id.toString();
        data.name = `my test note ${generateRandomNum()}`;   
    });

    it(`it shoud create a Note in the Task's notes array and return the updated project`, async () => {
        
        const previousProjectData = await Project.findById(data.projectId);
        const previousTaskData = previousProjectData.tasks.find(t => t._id === data.taskId);
        
        const res = await       
            chai.request(app)
                .post(`/api/project/task/createTaskNote`)
                .send({ data });

        const { body } = res;        
        expect(res).to.have.status(200);
        expect(body._id).to.equal(data.projectId);
        
        const newTaskData = body.tasks.find(t => t._id === data.taskId);        
        const addedNote = newTaskData.notes[newTaskData.notes.length - 1];
        expect(addedNote.name).to.equal(data.name);
    }).timeout(10000);
});

describe('/PUT /api/project/task/note/update', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();

        project.tasks[0].notes.push({
            name: 'previous note value'
        });

        await project.save();

        data.projectId = project._id.toString();
        data.taskId = project.tasks[0]._id.toString();
        data.noteId = project.tasks[0].notes[0]._id.toString();
        data.name = 'note updated with chai and mocha'
    });

    it('it should update the note and return the updated Project', async () => {
        const res = await 
            chai.request(app)
                .put('/api/project/task/note/update')
                .send({ data });

        const { body } = res;
        console.log(body);
        const updatedTask = body.tasks.find(t => t._id === data.taskId);
        const updatedNote = updatedTask.notes.find(n => n._id === data.noteId);

        expect(res).to.have.status(200);
        expect(updatedNote.name).to.equal(data.name);
    }).timeout(10000);
});

describe('/PUT /api/project/task/subtask/update', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();

        project.tasks[0].subtasks.push({
            name: 'previous subtask value'
        });

        await project.save();

        data.projectId = project._id.toString();
        data.taskId = project.tasks[0]._id.toString();
        data.subtaskId = project.tasks[0].subtasks[0]._id.toString();
        data.name = 'subtask updated with chai and mocha'
    });

    it('it should update the subtask and return the updated project', async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/task/subtask/update')
                .send({ data });
        
        const { body } = res;
        const updatedTask = body.tasks.find(t => t._id === data.taskId);
        const updatedSubtask = updatedTask.subtasks.find(st => st._id === data.subtaskId);

        expect(res).to.have.status(200);
        expect(updatedSubtask.name).to.equal(data.name);
    }).timeout(10000);
});

describe('/PUT /api/project/task/subtask/delete', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();

        project.tasks[0].subtasks.push({
            name: 'previous subtask value'
        });

        await project.save();

        data.projectId = project._id.toString();
        data.taskId = project.tasks[0]._id.toString();
        data.subtaskId = project.tasks[0].subtasks[0]._id.toString();
    });

    it('it should delete the subtask and return the updated project', async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/task/subtask/delete')
                .send({ data });
        
        const { body } = res;
        const updatedTask = body.tasks.find(t => t._id === data.taskId);
        const updatedSubtask = updatedTask.subtasks.find(st => st._id === data.subtaskId);

        expect(res).to.have.status(200);
        expect(updatedSubtask).to.be.undefined;
    }).timeout(10000);
});

describe('/PUT /api/project/task/delete', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id.toString();
        data.taskId = project.tasks[0]._id.toString();
    });

    it('it should delete the task and return the updated project', async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/task/delete')
                .send({ data });
        
        const { body } = res;
        const deletedTask = body.tasks.find(t => t._id === data.taskId);

        expect(res).to.have.status(200);
        expect(deletedTask).to.be.undefined;
    }).timeout(10000);
});

describe('/PUT /api/project/delete', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id.toString();
    });

    it('it should delete the project and return 200', async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/delete')
                .send({ data });
        
        const deletedProject = await Project.findById(data.projectId);

        expect(res).to.have.status(200);
        expect(deletedProject).to.be.null;
    }).timeout(10000);
});

describe('/PUT /api/project/update', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id.toString();
        data.name = `updated name ${generateRandomNum()}`
    });

    it('it should update the Project Name and return the Project', async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/update')
                .send({ data });
        
        const { body } = res;

        expect(res).to.have.status(200);
        expect(body.name).to.equal(data.name);
    }).timeout(10000);
});

describe('/PUT /api/project/task/complete', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id.toString();
        data.taskId = project.tasks[0]._id.toString();
        data.completed = true;
    });

    it(`it should update the Task's complete prop and return the updated Project`, async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/task/complete')
                .send({ data });
        
        const { body } = res;
        const updatedTask = body.tasks.find(t => t._id === data.taskId);

        expect(res).to.have.status(200);
        expect(updatedTask.completed).to.equal(data.completed);
    }).timeout(10000);
});

describe('/PUT /api/project/complete', () => {

    const data = {};

    before(async () => {
        const project = await generateProjectTask();
        data.projectId = project._id.toString();
        data.completed = true;
    });

    it(`it should update the Project's complete prop and return the updated Project`, async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/complete')
                .send({ data });
        
        const { body } = res;

        expect(res).to.have.status(200);
        expect(body.completed).to.equal(data.completed);
    }).timeout(10000);
});

describe('/PUT /api/project/task/subtask/complete', () => {
    
    const data = {};

    before(async () => {
        const project = await generateProjectTask();

        project.tasks[0].subtasks.push({
            name: 'previous subtask value'
        });

        await project.save();

        data.projectId = project._id.toString();
        data.taskId = project.tasks[0]._id.toString();
        data.subtaskId = project.tasks[0].subtasks[0]._id.toString();
        data.completed = true;
    });


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
