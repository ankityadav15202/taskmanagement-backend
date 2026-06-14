const express = require('express');
const { getAllUsers, deactivateUser } = require('../controllers/userController');
const { getDashboard } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);

router.get('/users', getAllUsers);

router.patch('/users/:id/deactivate', adminOnly, deactivateUser);

module.exports = router;
