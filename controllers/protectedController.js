const User = require('../models/User');

exports.studentDashboard = (req, res) => {
  res.json({ message: "Welcome Student" });
};

exports.adminDashboard = (req, res) => {
  res.json({ message: "Welcome Admin" });
};

// Get total student count
exports.getStudentCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'student' });
    res.json({ count });
  } catch (error) {
    console.error('❌ Get student count error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch student count'
    });
  }
};

// Get fee total (delegates to fee controller)
exports.getFeeTotal = async (req, res) => {
  try {
    const Fee = require('../models/Fee');
    const total = await Fee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$paidFees' }
        }
      }
    ]);

    res.json({ total: total[0]?.total || 0 });
  } catch (error) {
    console.error('❌ Get fee total error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch fee total'
    });
  }
};