const express = require('express');
const { getAllUsers, deactivateUser } = require('../controllers/userController');
const { getDashboard } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Admin only }
 */
router.get('/users', adminOnly, getAllUsers);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deactivated }
 */
router.patch('/users/:id/deactivate', adminOnly, deactivateUser);

module.exports = router;
