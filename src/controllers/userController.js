const User = require('../models/User');

// Admin: get all users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
};

// Admin: deactivate user
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate yourself.' });
    }
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User deactivated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, deactivateUser };
