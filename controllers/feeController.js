const Fee = require('../models/Fee');
const User = require('../models/User');

// Get all fees with student information
exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('student', 'fullName rollNumber class section studentId')
      .sort({ createdAt: -1 });

    // Transform data to match frontend format
    const feesData = fees.map(fee => {
      const student = fee.student;
      return {
        _id: fee._id,
        studentName: student?.fullName || 'Unknown',
        rollNumber: student?.rollNumber || 'N/A',
        class: student?.class || 'N/A',
        section: student?.section || '',
        totalFees: fee.totalFees,
        paidFees: fee.paidFees,
        pendingFees: fee.pendingFees,
        status: fee.status,
        dueDate: fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A',
        academicYear: fee.academicYear,
        month: fee.month
      };
    });

    res.json(feesData);
  } catch (error) {
    console.error('❌ Get all fees error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch fee data'
    });
  }
};

// Get fee by student ID
exports.getFeeByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const fees = await Fee.find({ student: studentId })
      .populate('student', 'fullName rollNumber class section')
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (error) {
    console.error('❌ Get fee by student error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch student fee data'
    });
  }
};

// Create or update fee
exports.createOrUpdateFee = async (req, res) => {
  try {
    const { studentId, totalFees, paidFees, dueDate, month, academicYear } = req.body;

    if (!studentId || !totalFees) {
      return res.status(400).json({ 
        error: 'Student ID and total fees are required' 
      });
    }

    // Check if fee already exists for this student and month
    let fee = await Fee.findOne({ 
      student: studentId, 
      month: month || new Date().toLocaleString('default', { month: 'long' })
    });

    if (fee) {
      // Update existing fee
      fee.totalFees = totalFees || fee.totalFees;
      fee.paidFees = paidFees !== undefined ? paidFees : fee.paidFees;
      fee.dueDate = dueDate ? new Date(dueDate) : fee.dueDate;
      fee.academicYear = academicYear || fee.academicYear;
      await fee.save();
    } else {
      // Create new fee
      fee = new Fee({
        student: studentId,
        totalFees,
        paidFees: paidFees || 0,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        month: month || new Date().toLocaleString('default', { month: 'long' }),
        academicYear: academicYear || new Date().getFullYear().toString()
      });
      await fee.save();
    }

    await fee.populate('student', 'fullName rollNumber class section');
    res.status(201).json(fee);
  } catch (error) {
    console.error('❌ Create/update fee error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create/update fee'
    });
  }
};

// Record payment
exports.recordPayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { amount, paymentMethod, receiptNumber, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Valid payment amount is required' 
      });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ error: 'Fee not found' });
    }

    // Add payment to history
    fee.paymentHistory.push({
      amount,
      paymentMethod: paymentMethod || 'Cash',
      receiptNumber: receiptNumber || `RCP-${Date.now()}`,
      notes: notes || ''
    });

    // Update paid amount
    fee.paidFees += amount;
    await fee.save();

    await fee.populate('student', 'fullName rollNumber class section');
    res.json(fee);
  } catch (error) {
    console.error('❌ Record payment error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to record payment'
    });
  }
};

// Get total fees collected
exports.getTotalFees = async (req, res) => {
  try {
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
    console.error('❌ Get total fees error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch total fees'
    });
  }
};

