const commentService = require('../services/commentService');

const getComments = async (req, res, next) => {
  try {
    const comments = await commentService.getTaskComments(req.params.taskId);
    res.status(200).json({ success: true, data: { comments } });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await commentService.addComment(req.params.taskId, req.body.text, req.user._id);
    res.status(201).json({ success: true, message: 'Comment added.', data: { comment } });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(req.params.commentId, req.body.text, req.user._id);
    res.status(200).json({ success: true, message: 'Comment updated.', data: { comment } });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await commentService.deleteComment(req.params.commentId, req.user._id, req.user.role);
    res.status(200).json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, addComment, updateComment, deleteComment };
