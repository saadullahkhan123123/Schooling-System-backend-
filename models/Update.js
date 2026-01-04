const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['announcement', 'test', 'class-off', 'general'],
    default: 'general'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'student', 'teacher', 'admin'],
    default: 'all'
  },
  targetClass: {
    type: String, // Specific class or 'all'
    default: 'all'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  date: {
    type: Date, // For test dates, class off dates, etc.
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for better query performance
updateSchema.index({ type: 1, targetAudience: 1, targetClass: 1 });
updateSchema.index({ isActive: 1, createdAt: -1 });
updateSchema.index({ date: 1 });

module.exports = mongoose.model('Update', updateSchema);

