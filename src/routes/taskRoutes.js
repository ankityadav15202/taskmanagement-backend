const express = require('express');
const { body, param, query } = require('express-validator');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getComments, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All task routes require authentication
router.use(protect);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks (with filters & pagination)
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in-progress, review, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *       - in: query
 *         name: assignee
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [dueDate, dueDate_desc, priority, createdAt] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of tasks with pagination }
 */
router.get('/', getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task data }
 *       404: { description: Task not found }
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task ID')],
  validate,
  getTask
);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               assignee: { type: string }
 *               status: { type: string, enum: [todo, in-progress, review, done] }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               dueDate: { type: string, format: date }
 *               labels: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Task created }
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('assignee').optional().isMongoId().withMessage('Invalid assignee ID'),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('labels').optional().isArray(),
  ],
  validate,
  createTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task updated }
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('assignee').optional().isMongoId().withMessage('Invalid assignee ID'),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('labels').optional().isArray(),
  ],
  validate,
  updateTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (soft delete)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task deleted }
 */
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task ID')],
  validate,
  deleteTask
);

// ---- Comment Routes (nested under tasks) ----

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 */
router.get('/:taskId/comments', getComments);

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments]
 */
router.post(
  '/:taskId/comments',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }),
  ],
  validate,
  addComment
);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 */
router.put(
  '/:taskId/comments/:commentId',
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }),
  ],
  validate,
  updateComment
);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 */
router.delete(
  '/:taskId/comments/:commentId',
  [param('commentId').isMongoId().withMessage('Invalid comment ID')],
  validate,
  deleteComment
);

module.exports = router;
