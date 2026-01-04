const Report = require('../models/Report');
const Attendance = require('../models/Attendance');
const Homework = require('../models/Homework');
const Fee = require('../models/Fee');
const Result = require('../models/Result');
const { ensureConnection } = require('../config/db');

// Create or update monthly report (Teacher/Admin only)
exports.createOrUpdateReport = async (req, res) => {
  try {
    await ensureConnection();
    
    const { student, month, year, remarks, teacherRemarks } = req.body;

    if (!student || !month || !year) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Student, month, and year are required'
      });
    }

    // Calculate attendance stats
    const startDate = new Date(year, getMonthIndex(month), 1);
    const endDate = new Date(year, getMonthIndex(month) + 1, 0, 23, 59, 59);
    
    const attendanceRecords = await Attendance.find({
      student,
      date: { $gte: startDate, $lte: endDate }
    });

    const attendance = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(a => a.status === 'present').length,
      absentDays: attendanceRecords.filter(a => a.status === 'absent').length,
      lateDays: attendanceRecords.filter(a => a.status === 'late').length,
      attendancePercentage: 0
    };

    if (attendance.totalDays > 0) {
      attendance.attendancePercentage = (attendance.presentDays / attendance.totalDays) * 100;
    }

    // Calculate homework stats
    const studentUser = await require('../models/User').findById(student);
    const homeworks = await Homework.find({
      class: studentUser?.class,
      dueDate: { $gte: startDate, $lte: endDate }
    });

    const homework = {
      assigned: homeworks.length,
      submitted: 0,
      pending: 0,
      completionRate: 0
    };

    homeworks.forEach(hw => {
      const submission = hw.submissions.find(s => s.student.toString() === student.toString());
      if (submission) {
        homework.submitted++;
      } else {
        homework.pending++;
      }
    });

    if (homework.assigned > 0) {
      homework.completionRate = (homework.submitted / homework.assigned) * 100;
    }

    // Get fee status
    const fee = await Fee.findOne({ student });
    const feeStatus = fee ? {
      totalFees: fee.totalFees || 0,
      paidFees: fee.paidFees || 0,
      pendingFees: fee.pendingFees || 0,
      status: fee.status || 'Pending'
    } : {
      totalFees: 0,
      paidFees: 0,
      pendingFees: 0,
      status: 'Pending'
    };

    // Calculate academic performance
    const results = await Result.find({
      student,
      examDate: { $gte: startDate, $lte: endDate }
    });

    const academicPerformance = {
      averageMarks: 0,
      totalExams: results.length,
      highestMarks: 0,
      lowestMarks: 0
    };

    if (results.length > 0) {
      const percentages = results.map(r => r.percentage || 0);
      academicPerformance.averageMarks = percentages.reduce((a, b) => a + b, 0) / percentages.length;
      academicPerformance.highestMarks = Math.max(...percentages);
      academicPerformance.lowestMarks = Math.min(...percentages);
    }

    // Create or update report
    const report = await Report.findOneAndUpdate(
      { student, month, year },
      {
        student,
        month,
        year,
        academicYear: year.toString(),
        attendance,
        homework,
        fees: feeStatus,
        academicPerformance,
        remarks,
        teacherRemarks,
        createdBy: req.user.id || req.user._id
      },
      { new: true, upsert: true, runValidators: true }
    )
      .populate('student', 'username email fullName class rollNumber section')
      .populate('createdBy', 'username email fullName');

    res.status(200).json({
      message: 'Report created/updated successfully',
      report
    });

  } catch (error) {
    console.error('❌ Create report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create report'
    });
  }
};

// Get all reports (filtered by role)
exports.getAllReports = async (req, res) => {
  try {
    await ensureConnection();
    
    const userRole = req.user.role;
    const userId = req.user.id || req.user._id;
    const { student, month, year, academicYear } = req.query;

    let filter = {};

    // Students see only their own reports
    if (userRole === 'student') {
      filter.student = userId;
    } else if (student) {
      filter.student = student;
    }

    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    if (academicYear) filter.academicYear = academicYear;

    const reports = await Report.find(filter)
      .populate('student', 'username email fullName class rollNumber section')
      .populate('createdBy', 'username email fullName')
      .sort({ year: -1, month: -1 });

    res.json({ reports });

  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reports'
    });
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id || req.user._id;

    const report = await Report.findById(id)
      .populate('student', 'username email fullName class rollNumber section')
      .populate('createdBy', 'username email fullName');

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    // Students can only see their own reports
    if (userRole === 'student' && report.student._id.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to other student\'s reports'
      });
    }

    res.json({ report });

  } catch (error) {
    console.error('❌ Get report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch report'
    });
  }
};

// Delete report (Admin only)
exports.deleteReport = async (req, res) => {
  try {
    await ensureConnection();
    
    const { id } = req.params;

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    res.json({
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete report'
    });
  }
};

// Helper function to get month index
function getMonthIndex(monthName) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months.indexOf(monthName);
}

