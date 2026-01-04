const Result = require('../models/Result');
const User = require('../models/User');
const { ensureConnection } = require('../config/db');

// Create or update result (Teacher/Admin only)
exports.createResult = async (req, res) => {
  try {
    await ensureConnection();
    
    const { student, subject, examType, examName, marksObtained, totalMarks, remarks, examDate, semester } = req.body;

    if (!student || !subject || !examType || !examName || marksObtained === undefined || !totalMarks) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Student, subject, exam type, exam name, marks obtained, and total marks are required'
      });
    }

    const result = new Result({
      student,
      subject,
      examType,
      examName,
      marksObtained: Number(marksObtained),
      totalMarks: Number(totalMarks),
      remarks,
      examDate: examDate ? new Date(examDate) : new Date(),
      semester: semester || '1st',
      addedBy: req.user.id || req.user._id
    });

    await result.save();
    await result.populate('student', 'username email fullName class rollNumber');
    await result.populate('addedBy', 'username email fullName');

    res.status(201).json({
      message: 'Result added successfully',
      result
    });

  } catch (error) {
    console.error('❌ Create result error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add result'
    });
  }
};

// Get all results (filtered by role)
exports.getAllResults = async (req, res) => {
  try {
    await ensureConnection();
    
    const userRole = req.user.role;
    const userId = req.user.id || req.user._id;
    const { student, subject, examType, academicYear, semester } = req.query;

    let filter = {};

    // Students see only their own results
    if (userRole === 'student') {
      filter.student = userId;
    } else if (student) {
      filter.student = student;
    }

    if (subject) filter.subject = subject;
    if (examType) filter.examType = examType;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;

    const results = await Result.find(filter)
      .populate('student', 'username email fullName class rollNumber section')
      .populate('addedBy', 'username email fullName')
      .sort({ examDate: -1 });

    res.json({ results });

  } catch (error) {
    console.error('❌ Get results error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch results'
    });
  }
};

// Get result by ID
exports.getResultById = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id || req.user._id;

    const result = await Result.findById(id)
      .populate('student', 'username email fullName class rollNumber section')
      .populate('addedBy', 'username email fullName');

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Result not found'
      });
    }

    // Students can only see their own results
    if (userRole === 'student' && result.student._id.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to other student\'s results'
      });
    }

    res.json({ result });

  } catch (error) {
    console.error('❌ Get result error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch result'
    });
  }
};

// Update result (Teacher/Admin only)
exports.updateResult = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.student;
    delete updates.addedBy;
    delete updates.createdAt;

    if (updates.marksObtained !== undefined) updates.marksObtained = Number(updates.marksObtained);
    if (updates.totalMarks !== undefined) updates.totalMarks = Number(updates.totalMarks);
    if (updates.examDate) updates.examDate = new Date(updates.examDate);

    const result = await Result.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('student', 'username email fullName class rollNumber section')
      .populate('addedBy', 'username email fullName');

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Result not found'
      });
    }

    res.json({
      message: 'Result updated successfully',
      result
    });

  } catch (error) {
    console.error('❌ Update result error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update result'
    });
  }
};

// Delete result (Admin only)
exports.deleteResult = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;

    const result = await Result.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Result not found'
      });
    }

    res.json({
      message: 'Result deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete result error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete result'
    });
  }
};

