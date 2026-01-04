const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December']
  },
  year: {
    type: Number,
    required: true,
    default: new Date().getFullYear()
  },
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString()
  },
  attendance: {
    totalDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 }
  },
  academicPerformance: {
    averageMarks: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    highestMarks: { type: Number, default: 0 },
    lowestMarks: { type: Number, default: 0 }
  },
  homework: {
    assigned: { type: Number, default: 0 },
    submitted: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }
  },
  fees: {
    totalFees: { type: Number, default: 0 },
    paidFees: { type: Number, default: 0 },
    pendingFees: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Partial', 'Pending'], default: 'Pending' }
  },
  remarks: {
    type: String,
    trim: true
  },
  teacherRemarks: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate percentages before save
reportSchema.pre('save', function(next) {
  // Calculate attendance percentage
  if (this.attendance.totalDays > 0) {
    this.attendance.attendancePercentage = 
      (this.attendance.presentDays / this.attendance.totalDays) * 100;
  }
  
  // Calculate homework completion rate
  if (this.homework.assigned > 0) {
    this.homework.completionRate = 
      (this.homework.submitted / this.homework.assigned) * 100;
  }
  
  next();
});

// Index for better query performance
reportSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });
reportSchema.index({ student: 1, academicYear: 1 });
reportSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Report', reportSchema);

