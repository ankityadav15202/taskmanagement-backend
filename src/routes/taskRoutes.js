const express = require('express');
const { body, param, query } = require('express-validator');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getComments, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { getHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All task routes require authentication
router.use(protect);

router.get('/', getTasks);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task ID')],
  validate,
  getTask
);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('assignee').optional({ nullable: true }).isMongoId().withMessage('Invalid assignee ID'),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
    body('labels').optional().isArray(),
  ],
  validate,
  createTask
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('assignee').optional({ nullable: true }).isMongoId().withMessage('Invalid assignee ID'),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
    body('labels').optional().isArray(),
  ],
  validate,
  updateTask
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task ID')],
  validate,
  deleteTask
);

// ---- History Routes (nested under tasks) ----
router.get(
  '/:taskId/history',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  validate,
  getHistory
);

// ---- Comment Routes (nested under tasks) ----

router.get('/:taskId/comments', getComments);

router.post(
  '/:taskId/comments',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }),
  ],
  validate,
  addComment
);

router.put(
  '/:taskId/comments/:commentId',
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }),
  ],
  validate,
  updateComment
);

router.delete(
  '/:taskId/comments/:commentId',
  [param('commentId').isMongoId().withMessage('Invalid comment ID')],
  validate,
  deleteComment
);

module.exports = router;
