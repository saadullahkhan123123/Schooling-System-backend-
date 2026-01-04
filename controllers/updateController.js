const Update = require('../models/Update');
const { ensureConnection } = require('../config/db');

// Create update (Admin/Teacher only)
exports.createUpdate = async (req, res) => {
  try {
    await ensureConnection();
    
    const { title, message, type, targetAudience, targetClass, priority, date } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title and message are required'
      });
    }

    const update = new Update({
      title,
      message,
      type: type || 'general',
      targetAudience: targetAudience || 'all',
      targetClass: targetClass || 'all',
      priority: priority || 'medium',
      date: date ? new Date(date) : undefined,
      createdBy: req.user.id || req.user._id
    });

    await update.save();
    await update.populate('createdBy', 'username email fullName');

    res.status(201).json({
      message: 'Update created successfully',
      update
    });

  } catch (error) {
    console.error('❌ Create update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create update'
    });
  }
};

// Get all updates (filtered by role and class)
exports.getAllUpdates = async (req, res) => {
  try {
    await ensureConnection();
    
    const userRole = req.user.role;
    const userClass = req.user.class;
    const { type, targetAudience } = req.query;

    let filter = { isActive: true };

    // Students see only updates for their class or all
    if (userRole === 'student') {
      filter.$or = [
        { targetClass: 'all' },
        { targetClass: userClass },
        { targetAudience: 'all' },
        { targetAudience: 'student' }
      ];
    }

    // Filter by type if provided
    if (type) {
      filter.type = type;
    }

    // Filter by target audience if provided
    if (targetAudience) {
      filter.targetAudience = targetAudience;
    }

    const updates = await Update.find(filter)
      .populate('createdBy', 'username email fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ updates });

  } catch (error) {
    console.error('❌ Get updates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch updates'
    });
  }
};

// Get update by ID
exports.getUpdateById = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;

    const update = await Update.findById(id)
      .populate('createdBy', 'username email fullName');

    if (!update || !update.isActive) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Update not found'
      });
    }

    res.json({ update });

  } catch (error) {
    console.error('❌ Get update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch update'
    });
  }
};

// Update update (Admin/Teacher only)
exports.updateUpdate = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.createdBy;
    delete updates.createdAt;

    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    const update = await Update.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email fullName');

    if (!update) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Update not found'
      });
    }

    res.json({
      message: 'Update updated successfully',
      update
    });

  } catch (error) {
    console.error('❌ Update update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update update'
    });
  }
};

// Delete update (Admin/Teacher only)
exports.deleteUpdate = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;

    const update = await Update.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!update) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Update not found'
      });
    }

    res.json({
      message: 'Update deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete update'
    });
  }
};

