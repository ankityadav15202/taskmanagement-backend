const Task = require('../models/Task');
const User = require('../models/User');
const historyService = require('./historyService');

const buildTaskQuery = (queryParams, userId, role) => {
  const { search, status, priority, assignee, sortBy } = queryParams;
  const filter = {};

  // Role-based filtering
  if (role === 'member') {
    filter.$or = [{ assignee: userId }, { createdBy: userId }];
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { $or: [{ title: searchRegex }, { description: searchRegex }] }
      ];
      delete filter.$or;
    } else {
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
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
  if (taskData.status && taskData.status !== 'todo' && !taskData.assignee) {
    const error = new Error('Task must be assigned to someone before changing its status.');
    error.statusCode = 400;
    throw error;
  }
  const task = await Task.create({ ...taskData, createdBy: userId });
  await historyService.recordHistory(task._id, userId, 'create');
  return task;
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

  const newStatus = updateData.status !== undefined ? updateData.status : task.status;
  const newAssignee = updateData.assignee !== undefined ? updateData.assignee : task.assignee;
  if (updateData.status !== undefined && updateData.status !== task.status && !newAssignee) {
    const error = new Error('Task must be assigned to someone before changing its status.');
    error.statusCode = 400;
    throw error;
  }

  const changes = [];

  // 1. Title
  if (updateData.title !== undefined && updateData.title !== task.title) {
    changes.push({ field: 'title', oldValue: task.title, newValue: updateData.title });
  }

  // 2. Description
  if (updateData.description !== undefined && updateData.description !== task.description) {
    changes.push({ field: 'description', oldValue: task.description, newValue: updateData.description });
  }

  // 3. Status
  if (updateData.status !== undefined && updateData.status !== task.status) {
    changes.push({ field: 'status', oldValue: task.status, newValue: updateData.status });
  }

  // 4. Priority
  if (updateData.priority !== undefined && updateData.priority !== task.priority) {
    changes.push({ field: 'priority', oldValue: task.priority, newValue: updateData.priority });
  }

  // 5. Due Date
  const oldDateStr = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : null;
  const newDateStr = updateData.dueDate ? new Date(updateData.dueDate).toISOString().slice(0, 10) : null;
  if (updateData.dueDate !== undefined && oldDateStr !== newDateStr) {
    changes.push({ field: 'dueDate', oldValue: oldDateStr, newValue: newDateStr });
  }

  // 6. Labels
  if (updateData.labels !== undefined) {
    const oldLabelsSorted = [...(task.labels || [])].sort().join(', ');
    const newLabelsSorted = [...(updateData.labels || [])].sort().join(', ');
    if (oldLabelsSorted !== newLabelsSorted) {
      changes.push({
        field: 'labels',
        oldValue: task.labels?.length ? task.labels.join(', ') : null,
        newValue: updateData.labels?.length ? updateData.labels.join(', ') : null,
      });
    }
  }

  // 7. Assignee
  const oldAssigneeId = task.assignee?.toString() || null;
  const newAssigneeId = updateData.assignee !== undefined ? (updateData.assignee?.toString() || null) : oldAssigneeId;
  if (updateData.assignee !== undefined && oldAssigneeId !== newAssigneeId) {
    const userIds = [];
    if (oldAssigneeId) userIds.push(oldAssigneeId);
    if (newAssigneeId) userIds.push(newAssigneeId);

    let oldName = 'Unassigned';
    let newName = 'Unassigned';

    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } });
      const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u.name }), {});
      if (oldAssigneeId) oldName = userMap[oldAssigneeId] || 'Unknown User';
      if (newAssigneeId) newName = userMap[newAssigneeId] || 'Unknown User';
    }

    changes.push({ field: 'assignee', oldValue: oldName, newValue: newName });
  }

  Object.assign(task, updateData);
  await task.save();

  if (changes.length > 0) {
    await historyService.recordHistory(task._id, userId, 'update', changes);
  }

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
