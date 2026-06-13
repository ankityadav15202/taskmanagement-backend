const taskService = require('../services/taskService');

const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getAllTasks(req.query, req.user._id, req.user.role);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user._id);
    res.status(201).json({ success: true, message: 'Task created successfully.', data: { task } });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user._id, req.user.role);
    res.status(200).json({ success: true, message: 'Task updated successfully.', data: { task } });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
