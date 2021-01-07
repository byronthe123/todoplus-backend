const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const yup = require('yup');
const app = require('../app');
const { User } = require('../models/index');
const { 
    userDataSchema, 
    projectSchema, 
    taskSchema, 
    subtaskSchema,
    productivityRecordSchema 
} = require('../testData/index');

chai.use(chaiHttp);
chai.use(chai => {
    const { Assertion } = chai;
    Assertion.addMethod("yupSchema", function validate(expectedSchema) {
        const obj = this._obj;
        new Assertion(() => expectedSchema.validateSync(obj)).not.to.throw();
    });
});

describe('/POST /api/userData', () => {
    it(`it should return the user's data if the user exists`, (done) => {
        chai.request(app)
            .post('/api/userData')
            .set({ Authorization: `Bearer testing` })
            .send({ email: '3rag0nshadeslayer@gmail.com' })
            .end((err, res) => {
                // console.log(res.body);
                expect(res).to.have.status(200);
                expect(res.body).to.be.a.yupSchema(userDataSchema);
                done();
            });
    }).timeout(10000);

    it(`it should create a new user and return it's data if no user exists`, (done) => {
        chai.request(app)
            .post(`/api/userData`)
            .set({ Authorization: `Bearer test` })
            .send({ email: 'test@gmail.com' })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.a.yupSchema(userDataSchema);
                done();
            });
    }).timeout(10000);
});

describe('/POST /api/addProject', () => {
    const data = {
        userId: '5fb02c80f2f2c5437049ba4e',
        name: 'Project 1'
    }

    it(`it should create a new project, add the project._id to the user's projects array, return the created project`, (done) => {
        chai.request(app)
            .post('/api/addProject')
            .send({ data })
            .end((err, res) => {
                expect(res).have.status(200);
                expect(res.body).to.be.a.yupSchema(projectSchema);

                User.findById(data.userId, (err, doc) => {
                    const createdProjectId = res.body._id;
                    const { projects } = doc;

                    // const createdProjectIndex = projects.indexOf(createdProjectId);
                    // expect(createdProjectIndex).to.not.equal(-1);

                    const foundProject = projects.find(p => p.toString() === createdProjectId.toString());
                    expect(foundProject).to.not.equal(undefined);
                    done();
                });
            });
    })
});

describe('/POST /project/addTask', () => {
    const data = {
        name: 'Task number 2.',
        projectId: '5fcac9f19ac7084388dd2047'
    };

    it(`it should add a task to the specified project and return the updated project`, (done) => {
        chai.request(app)
            .post('/api/project/addTask')
            .send({ data })
            .end((err, res) => {
                const { tasks } = res.body;
                expect(res).to.have.status(200);
                const addedTask = tasks.find(t => t.name === data.name);
                expect(addedTask).to.not.be.undefined;
                expect(addedTask).to.be.a.yupSchema(taskSchema);
                expect(addedTask.projectId).to.equal(data.projectId);
                done();
            });
    }).timeout(10000);
});

describe('/POST /api/project/task/addSubtask', () => {

    const data = {
        projectId: '5fb03f1d36e32d373c21b55d',
        taskId: '5fb299d0d5f6ff5ccc33e200',
        name: 'Subtask 1'
    }

    it('it should create a subtask in projects[id] -> tasks[id] -> subtasks and return the created subtask', (done) => {
        chai.request(app)
            .post('/api/project/task/addSubtask')
            .send({ data })
            .end((err, res) => {
                const updatedProject = res.body; // body = updatedProject
                const updatedTask = updatedProject.tasks.find(t => t._id === data.taskId);
                const createdSubtask = updatedTask.subtasks.find(st => st.name === data.name);
                
                expect(res).to.have.status(200);
                expect(createdSubtask).to.not.be.undefined;
                expect(createdSubtask).to.be.a.yupSchema(subtaskSchema);
                done();
            });
    }).timeout(10000);
});

describe('/PUT /user/setWeeklyProductivityGoal', () => {

    it(`It should throw a 400 error is data is missing from the req.body.data`, (done) => {
        const data = {
            _id: ''        
        };
        
        chai.request(app)
            .post('/api/user/setWeeklyProductivityGoal')
            .send({ data })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    }); 

    it(`It should update the user's weeklyProductivityGoal goal.`, (done) => {
        const data = {
            _id: '5fb02c80f2f2c5437049ba4e',
            weeklyProductivityGoal: 56
        };

        chai.request(app)
            .post('/api/user/setWeeklyProductivityGoal')
            .send({ data })
            .end((err, res) => {
                console.log(err);
                expect(res).to.have.status(200);
                User.findById(data._id)
                    .exec((err, doc) => {
                        expect(doc.weeklyProductivityGoal).to.equal(data.weeklyProductivityGoal);
                        done();
                    });
            });
    }).timeout(10000);
});

describe('/PUT /user/setProductivityGoal', () => {
    const data = {
        productivityRecordId: '5fbabf3b548ac243bc19a3d0',
        productivityGoal: '14400'
    };

    it(`it should update the productivityGoal of the user's current productivityRecord and return the record`, (done) => {
        chai.request(app)
            .put('/api/user/setProductivityGoal')
            .send({ data })
            .end((err, res) => {
                const { body } = res;
                const { _id, productivityGoal } = body;
                expect(res).to.have.status(200);
                expect(body).to.be.a.yupSchema(productivityRecordSchema); 
                expect(_id).to.equal(data.productivityRecordId);
                expect(parseInt(productivityGoal)).to.equal(parseInt(data.productivityGoal));
                done();
            });
    }).timeout(10000);
}); 

describe('/PUT /api/project/task/update', () => {
    const data = {
        projectId: '5fb03f1d36e32d373c21b55d',
        taskId: '5fb18a0965af5d54f0b5bc55',
        name: 'Updated task 2'
    };

    it(`it should update the project's task's name and return the updated project`, (done) => {
        chai.request(app)
            .put('/api/project/task/update')
            .send({ data })
            .end((err, res) => {
                const { body } = res;
                const { _id, tasks } = body;
                expect(res).to.have.status(200);
                expect(body).to.be.a.yupSchema(projectSchema);
                expect(_id).to.equal(data.projectId);
                const updatedTask = tasks.find(t => t._id === data.taskId);
                expect(updatedTask.name).to.equal(data.name);
                done();
            });
    }).timeout(10000);
});

describe('/POST /api/productivityRecord/createProductivityEntry', () => {
    const data = {
        productivityRecordId: '5fc5b02f56f83d4860617463',
        task: {
            completed:false,
            _id: "5fc446914bb87a542855a005",
            name:"task 1",
            updatedAt: new Date(),
            createdAt: new Date(),
            subtasks:[
               
            ]
        },
    };

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
        expect(body._id).to.equal(data.productivityRecordId);
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
        expect(body._id).to.equal(data.productivityRecordId);
        expect(foundEntry).to.not.equal(null);
        expect(foundEntry).to.not.equal(undefined);
        expect(createdEntry.task._id).to.equal(data.task._id);
        expect(createdEntry).to.be.a.yupSchema(entrySchema);
        expect(createdEntry.productiveTime).to.equal(1500);
    }).timeout(10000);
});

describe('/PUT /project/task/setDueDate', () => {
    const data = {
        projectId: '5fcac9f19ac7084388dd2047',
        taskId: '5fcac9f49ac7084388dd2048',
        dueDate: '12/05/2020 6:00 PM'
    };  

    it(`it should set the due date of the Project's Task and return the Project`, async () => {
        const res = await 
            chai.request(app)
                .put(`/api/project/task/setDueDate`)
                .send({ data });

        const { body } = res;
        expect(res).to.have.status(200);
        // expect(res).to.be.a.yupSchema(projectSchema);
        expect(body._id).to.equal(data.projectId);
        const task = body.tasks.find(t => t._id === data.taskId);
        console.log(task.dueDate);
        expect(
            moment(task.dueDate).format('MM/DD/YYYY HH:mm')
        ).to.equal(
            moment(data.dueDate).format('MM/DD/YYYY HH:mm')
        );
    }).timeout(10000);
});

describe('/PUT /project/task/setReminderDate', () => {
    const data = {
        projectId: '5fcac9f19ac7084388dd2047',
        taskId: '5fcac9f49ac7084388dd2048',
        reminderDate: '12/05/2020 6:00 PM'
    };  

    it(`it should set the reminder date of the Project's Task and return the Project`, async () => {
        const res = await 
            chai.request(app)
                .put(`/api/project/task/setReminderDate`)
                .send({ data });

        const { body } = res;
        expect(res).to.have.status(200);
        // expect(res).to.be.a.yupSchema(projectSchema);
        expect(body._id).to.equal(data.projectId);
        const task = body.tasks.find(t => t._id === data.taskId);
        console.log(task.reminderDate);
        expect(
            moment(task.reminderDate).format('MM/DD/YYYY HH:mm')
        ).to.equal(
            moment(data.reminderDate).format('MM/DD/YYYY HH:mm')
        );
    }).timeout(10000);
});

describe('/POST /project/addTask', () => {
    const data = {
        name: 'Task number 2.',
        projectId: '5fcac9f19ac7084388dd2047'
    };

    it(`it should add a task to the specified project and return the updated project`, (done) => {
        chai.request(app)
            .post('/api/project/addTask')
            .send({ data })
            .end((err, res) => {
                const { tasks } = res.body;
                expect(res).to.have.status(200);
                const addedTask = tasks.find(t => t.name === data.name);
                expect(addedTask).to.not.be.undefined;
                expect(addedTask).to.be.a.yupSchema(taskSchema);
                expect(addedTask.projectId).to.equal(data.projectId);
                done();
            });
    }).timeout(10000);
});

describe('/POST /api/project/task/createTaskNote', () => {
    const data = {
        projectId: '5feb8a2d93972f53789c174a',
        taskId: '5feb8a3593972f53789c174b',
        name: 'my test note 3'
    };

    it(`it shoud create a Note in the Task's notes array and return the updated project`, async () => {
        
        const previousProjectData = await Project.findById(data.projectId);
        console.log(previousProjectData);
        const previousTaskData = previousProjectData.tasks.find(t => t._id === data.taskId);
        
        const res = await       
            chai.request(app)
                .post(`/api/project/task/createTaskNote`)
                .send({ data });

        const { body } = res;        
        expect(res).to.have.status(200);
        expect(body._id).to.equal(data.projectId);
        
        const newTaskData = body.tasks.find(t => t._id === data.taskId);

        console.log(previousTaskData);
        console.log(newTaskData);

        // expect(newTaskData.notes.length - previousTaskData.notes.length).to.equal(1);
        
        const addedNote = newTaskData.notes[newTaskData.notes.length - 1];
        expect(addedNote.name).to.equal(data.name);
    }).timeout(10000);
});

describe('/PUT /api/project/task/note/update', () => {

    const data = {
        name: 'note updated with mocha',
        projectId: '5feb8a2d93972f53789c174a',
        taskId: '5febaaf0a49b0759c0533301',
        noteId: '5fece8446fc6ca54c81624a8'
    };

    it('it should update the note and return the updated Project', async () => {
        const res = await 
            chai.request(app)
                .put('/api/project/task/note/update')
                .send({ data });

        const { body } = res;
        const updatedTask = body.tasks.find(t => t._id === data.taskId);
        const updatedNote = updatedTask.notes.find(n => n._id === data.noteId);

        expect(res).to.have.status(200);
        expect(updatedNote.name).to.equal(data.name);
    }).timeout(10000);
});

describe('/PUT /api/project/task/subtask/update', () => {

    const data = {
        projectId: '5feb8a2d93972f53789c174a',
        taskId: '5febaaf0a49b0759c0533301',
        subtaskId: '5fed4c609cd8ad5de8806f6e',
        name: 'Updated subtask value'
    };

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

    const data = {
        projectId: '5feb8a2d93972f53789c174a',
        taskId: '5febaaf0a49b0759c0533301',
        subtaskId: '5fed4c609cd8ad5de8806f6e'
    };

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

    const data = {
        projectId: '5feb8a2d93972f53789c174a',
        taskId: '5febaaf0a49b0759c0533301',
    };

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

    const data = {
        projectId: '5fefb3b1fd260d249460d135',
    };

    it('it should delete the project and return 200', async () => {
                
        const res = await       
            chai.request(app)
                .put('/api/project/delete')
                .send({ data });
        
        const { body } = res;
        const deletedProject = await Project.findById(data.projectId);

        expect(res).to.have.status(200);
        expect(deletedProject).to.be.null;
    }).timeout(10000);
});

describe('/PUT /api/project/update', () => {

    const data = {
        projectId: '5fefcb0a3fc093108480c30a',
        name: 'updated project name 2'
    };

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

    const data = {
        projectId: '5fefdc3d372b4b61ecf3bfe1',
        taskId: '5fefdc41372b4b61ecf3bfe2',
        completed: false
    };

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

    const data = {
        projectId: '5fefdc3d372b4b61ecf3bfe1',
        completed: true
    };

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
