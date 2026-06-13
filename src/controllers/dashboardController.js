const { getDashboardStats } = require('../services/dashboardService');

const getDashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardStats(req.user._id, req.user.role);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
