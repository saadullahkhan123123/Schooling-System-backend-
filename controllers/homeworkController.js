const Homework = require('../models/Homework');
const User = require('../models/User');

// Create new homework (Admin/Teacher only)
exports.createHomework = async (req, res) => {
  try {
    console.log('📝 Creating homework:', req.body);
    
    const { title, description, subject, class: className, dueDate, assignedTo } = req.body;

    // Validation
    if (!title || !description || !subject || !className || !dueDate) {
      return res.status(400).json({
        error: 'Title, description, subject, class, and due date are required'
      });
    }

    // Check if due date is in the future
    const dueDateObj = new Date(dueDate);
    if (dueDateObj <= new Date()) {
      return res.status(400).json({
        error: 'Due date must be in the future'
      });
    }

    const homework = new Homework({
      title,
      description,
      subject,
      class: className,
      dueDate: dueDateObj,
      assignedBy: req.user.id,
      assignedTo: assignedTo || 'all'
    });

    await homework.save();
    await homework.populate('assignedBy', 'username email');

    res.status(201).json({
      message: 'Homework created successfully',
      homework: homework.getSummary()
    });

  } catch (error) {
    console.error('❌ Create homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all homeworks with filters
exports.getAllHomeworks = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id || req.user._id;
    
    const { 
      class: className, 
      subject, 
      status, 
      page = 1, 
      limit = 10,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    // If student, only show homework for their class
    if (userRole === 'student') {
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user && user.class) {
        filter.class = user.class;
      } else {
        // If student has no class, return empty
        return res.json({
          homeworks: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        });
      }
    } else {
      // Admin/Teacher can filter by class
      if (className) filter.class = className;
    }
    
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const homeworks = await Homework.find(filter)
      .populate('assignedBy', 'username email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Homework.countDocuments(filter);

    // Get summary for each homework
    const homeworkSummaries = homeworks.map(hw => ({
      ...hw,
      isOverdue: hw.dueDate < new Date() && hw.status !== 'done'
    }));

    res.json({
      homeworks: homeworkSummaries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Get homeworks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get homework by ID
exports.getHomeworkById = async (req, res) => {
  try {
    const { id } = req.params;

    const homework = await Homework.findById(id)
      .populate('assignedBy', 'username email')
      .populate('submissions.student', 'username email fullName');

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    res.json({
      homework: {
        ...homework.toObject(),
        isOverdue: homework.dueDate < new Date() && homework.status !== 'done'
      }
    });

  } catch (error) {
    console.error('❌ Get homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update homework (Admin/Teacher only)
exports.updateHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.assignedBy;
    delete updates.submissions;
    delete updates.createdAt;
    delete updates.updatedAt;

    const homework = await Homework.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedBy', 'username email');

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    res.json({
      message: 'Homework updated successfully',
      homework: homework.getSummary()
    });

  } catch (error) {
    console.error('❌ Update homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete homework (Admin/Teacher only)
exports.deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    const homework = await Homework.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    res.json({ message: 'Homework deleted successfully' });

  } catch (error) {
    console.error('❌ Delete homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit homework (Student only)
exports.submitHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionText, attachments = [] } = req.body;

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check if already submitted
    const existingSubmission = homework.submissions.find(
      sub => sub.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(400).json({ error: 'Homework already submitted' });
    }

    // Add submission
    homework.submissions.push({
      student: req.user.id,
      submissionText,
      attachments
    });

    await homework.save();

    res.json({
      message: 'Homework submitted successfully',
      submission: homework.submissions[homework.submissions.length - 1]
    });

  } catch (error) {
    console.error('❌ Submit homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Grade homework (Admin/Teacher only)
exports.gradeHomework = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { grade, feedback } = req.body;

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    const submission = homework.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';

    await homework.save();

    res.json({
      message: 'Homework graded successfully',
      submission: submission
    });

  } catch (error) {
    console.error('❌ Grade homework error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get homework statistics
exports.getHomeworkStats = async (req, res) => {
  try {
    const stats = await Homework.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalHomeworks: { $sum: 1 },
          activeHomeworks: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingHomeworks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          doneHomeworks: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          },
          overdueHomeworks: {
            $sum: {
              $cond: [
                { $and: [
                  { $lt: ['$dueDate', new Date()] },
                  { $ne: ['$status', 'done'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalHomeworks: 0,
        activeHomeworks: 0,
        pendingHomeworks: 0,
        doneHomeworks: 0,
        overdueHomeworks: 0
      }
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
