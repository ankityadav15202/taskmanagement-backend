const Task = require('../models/Task');

const buildTaskQuery = (queryParams, userId, role) => {
  const { search, status, priority, assignee, sortBy } = queryParams;
  const filter = {};

  // Role-based filtering
  if (role === 'member') {
    filter.$or = [{ assignee: userId }, { createdBy: userId }];
  }

  if (search) {
    filter.$text = { $search: search };
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;

  const sort = {};
  if (sortBy === 'dueDate') sort.dueDate = 1;
  else if (sortBy === 'dueDate_desc') sort.dueDate = -1;
  else if (sortBy === 'priority') sort.priority = -1;
  else sort.createdAt = -1; // default

  return { filter, sort };
};

const getAllTasks = async (queryParams, userId, role) => {
  const { filter, sort } = buildTaskQuery(queryParams, userId, role);
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getTaskById = async (taskId, userId, role) => {
  const task = await Task.findById(taskId)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar');

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  // Members can only view tasks they created or are assigned to
  if (
    role === 'member' &&
    task.assignee?._id.toString() !== userId.toString() &&
    task.createdBy._id.toString() !== userId.toString()
  ) {
    const error = new Error('Access denied.');
    error.statusCode = 403;
    throw error;
  }

  return task;
};

const createTask = async (taskData, userId) => {
  return Task.create({ ...taskData, createdBy: userId });
};

const updateTask = async (taskId, updateData, userId, role) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  // Members can only update tasks assigned to them
  if (role === 'member' && task.assignee?.toString() !== userId.toString()) {
    const error = new Error('Access denied. You can only update tasks assigned to you.');
    error.statusCode = 403;
    throw error;
  }

  // Members cannot reassign tasks
  if (role === 'member') {
    delete updateData.assignee;
    delete updateData.createdBy;
  }

  Object.assign(task, updateData);
  await task.save();

  return Task.findById(taskId)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

const deleteTask = async (taskId, userId, role) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  // Only admin or task creator can delete
  if (role !== 'admin' && task.createdBy.toString() !== userId.toString()) {
    const error = new Error('Access denied. Only admin or task creator can delete tasks.');
    error.statusCode = 403;
    throw error;
  }

  task.isDeleted = true;
  await task.save();
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
