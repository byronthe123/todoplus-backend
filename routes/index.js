const express = require('express');
const User = require('../models/User');
const notifier = require('node-notifier');
const path = require('path');
const router = express.Router();
const controller = require("../controller/index");
const { checkJwt } = require('../utils/index');

// all routes mapped against /api
router.route('/userData')
      .post(checkJwt, controller.userData);

router.route('/addProject')
      .post(checkJwt, controller.addProject);

router.route('/project/delete')
      .put(checkJwt, controller.deleteProject);

router.route('/project/update')
      .put(checkJwt, controller.updateProject);

router.route('/project/complete')
      .put(checkJwt, controller.completeProject);

router.route('/project/addTask')
      .post(controller.addTask);

router.route('/project/task/update')
      .put(checkJwt, controller.updateTask);

router.route('/project/task/delete')
      .put(checkJwt, controller.deleteTask);

router.route('/project/task/complete')
      .put(controller.completeTask);

router.route('/project/task/setDueDate')
      .put(checkJwt, controller.setTaskDueDate);

router.route('/project/task/setReminderDate')
      .put(checkJwt, controller.setReminderDate);

router.route('/project/task/addSubtask')
      .post(checkJwt, controller.addSubtask);

router.route('/project/task/subtask/update')
      .put(checkJwt, controller.updateSubtask);

router.route('/project/task/subtask/complete')
      .put(checkJwt, controller.completeSubtask);

router.route('/project/task/subtask/delete')
      .put(checkJwt, controller.deleteSubtask);

router.route('/project/task/updateEntryProductiveTime')
      .post(checkJwt, controller.updateEntryProductiveTime);

router.route('/project/task/createTaskNote')
      .post(checkJwt, controller.createTaskNote);

router.route('/profile/updateTodaysProductiveTime')
      .post(checkJwt, controller.updateTodaysProductiveTime);

router.route('/user/setProductivityGoal')
      .put(checkJwt, controller.setProductivityGoal);

router.route('/user/setWeeklyProductivityGoal')
      .put(checkJwt, controller.setWeeklyProductivityGoal);

router.route('/productivityRecord/createProductivityEntry')
      .post(checkJwt, controller.createProductivityEntry);

router.route('/project/task/note/update')
      .put(checkJwt, controller.updateNote);

router.route('/project/task/note/delete')
      .put(checkJwt, controller.deleteNote);

router.route('/project/task/saveAttachments')
      .post(checkJwt, controller.saveAttachments);

module.exports = router;