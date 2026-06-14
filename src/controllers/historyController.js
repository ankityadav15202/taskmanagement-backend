const historyService = require('../services/historyService');
const taskService = require('../services/taskService');

const getHistory = async (req, res, next) => {
  try {
    // First, verify the task exists and the user has access to it
    const task = await taskService.getTaskById(req.params.taskId, req.user._id, req.user.role);
    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    const history = await historyService.getTaskHistory(req.params.taskId);
    res.status(200).json({ success: true, data: { history } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,
};
