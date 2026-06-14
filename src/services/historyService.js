const TaskHistory = require('../models/TaskHistory');

/**
 * Record a new history log entry for a task.
 * @param {string} taskId - The ID of the task
 * @param {string} userId - The ID of the user performing the change
 * @param {'create'|'update'} action - The type of action performed
 * @param {Array} changes - List of change objects { field, oldValue, newValue }
 */
const recordHistory = async (taskId, userId, action, changes = []) => {
  try {
    return await TaskHistory.create({
      task: taskId,
      user: userId,
      action,
      changes,
    });
  } catch (error) {
    console.error('Failed to record task history:', error);
  }
};

/**
 * Get all history log entries for a specific task.
 * @param {string} taskId - The ID of the task
 */
const getTaskHistory = async (taskId) => {
  return TaskHistory.find({ task: taskId })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 });
};

module.exports = {
  recordHistory,
  getTaskHistory,
};
