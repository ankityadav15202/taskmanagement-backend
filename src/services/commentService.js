const Comment = require('../models/Comment');
const Task = require('../models/Task');

const getTaskComments = async (taskId) => {
  return Comment.find({ task: taskId })
    .populate('author', 'name email avatar')
    .sort({ createdAt: -1 });
};

const addComment = async (taskId, text, userId) => {
  // Verify task exists
  const task = await Task.findById(taskId);
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  const comment = await Comment.create({ task: taskId, author: userId, text });
  return Comment.findById(comment._id).populate('author', 'name email avatar');
};

const updateComment = async (commentId, text, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const error = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (comment.author.toString() !== userId.toString()) {
    const error = new Error('Access denied. You can only edit your own comments.');
    error.statusCode = 403;
    throw error;
  }

  comment.text = text;
  comment.isEdited = true;
  await comment.save();

  return Comment.findById(commentId).populate('author', 'name email avatar');
};

const deleteComment = async (commentId, userId, role) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const error = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (role !== 'admin' && comment.author.toString() !== userId.toString()) {
    const error = new Error('Access denied. You can only delete your own comments.');
    error.statusCode = 403;
    throw error;
  }

  comment.isDeleted = true;
  await comment.save();
};

module.exports = { getTaskComments, addComment, updateComment, deleteComment };
