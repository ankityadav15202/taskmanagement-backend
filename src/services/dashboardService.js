const Task = require('../models/Task');

const getDashboardStats = async (userId, role) => {
  const baseFilter = role === 'member'
    ? { $or: [{ assignee: userId }, { createdBy: userId }] }
    : {};

  const [
    totalTasks,
    tasksByStatus,
    tasksByPriority,
    myAssignedTasks,
    overdueTasks,
  ] = await Promise.all([
    // Total task count
    Task.countDocuments(baseFilter),

    // Tasks grouped by status
    Task.aggregate([
      { $match: { isDeleted: false, ...( role === 'member' ? {
        $or: [{ assignee: userId }, { createdBy: userId }]
      } : {}) }},
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // Tasks grouped by priority
    Task.aggregate([
      { $match: { isDeleted: false, ...( role === 'member' ? {
        $or: [{ assignee: userId }, { createdBy: userId }]
      } : {}) }},
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // Tasks assigned to current user
    Task.find({ assignee: userId, isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 })
      .limit(5),

    // Overdue tasks
    Task.countDocuments({
      ...baseFilter,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    }),
  ]);

  // Calculate completion percentage
  const doneTasks = tasksByStatus.find((s) => s._id === 'done')?.count || 0;
  const completionPercentage = totalTasks > 0
    ? Math.round((doneTasks / totalTasks) * 100)
    : 0;

  // Format status and priority maps
  const statusMap = {};
  tasksByStatus.forEach((s) => { statusMap[s._id] = s.count; });

  const priorityMap = {};
  tasksByPriority.forEach((p) => { priorityMap[p._id] = p.count; });

  return {
    totalTasks,
    completionPercentage,
    overdueTasks,
    tasksByStatus: {
      todo: statusMap['todo'] || 0,
      'in-progress': statusMap['in-progress'] || 0,
      review: statusMap['review'] || 0,
      done: statusMap['done'] || 0,
    },
    tasksByPriority: {
      low: priorityMap['low'] || 0,
      medium: priorityMap['medium'] || 0,
      high: priorityMap['high'] || 0,
      critical: priorityMap['critical'] || 0,
    },
    myAssignedTasks,
  };
};

module.exports = { getDashboardStats };
