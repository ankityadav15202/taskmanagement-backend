const mongoose = require('mongoose');

const changeSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

const taskHistorySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['create', 'update'],
      required: true,
    },
    changes: [changeSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for fetching task history chronologically
taskHistorySchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('TaskHistory', taskHistorySchema);
