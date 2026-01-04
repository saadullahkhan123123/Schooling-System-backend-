const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: [
      'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
      'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Physical Education',
      'Social Studies', 'Economics', 'Business Studies', 'Psychology', 'Sociology',
      'Political Science', 'Environmental Science', 'Literature', 'Philosophy'
    ]
  },
  examType: {
    type: String,
    enum: ['quiz', 'midterm', 'final', 'assignment', 'project', 'test'],
    required: true
  },
  examName: {
    type: String,
    required: true,
    trim: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
  },
  remarks: {
    type: String,
    trim: true
  },
  examDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString()
  },
  semester: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th', 'Annual'],
    default: '1st'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate percentage and grade before save
resultSchema.pre('save', function(next) {
  if (this.marksObtained !== undefined && this.totalMarks !== undefined) {
    this.percentage = (this.marksObtained / this.totalMarks) * 100;
    
    // Calculate grade based on percentage
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C+';
    else if (this.percentage >= 40) this.grade = 'C';
    else if (this.percentage >= 33) this.grade = 'D';
    else this.grade = 'F';
  }
  next();
});

// Index for better query performance
resultSchema.index({ student: 1, subject: 1, examDate: -1 });
resultSchema.index({ student: 1, academicYear: 1, semester: 1 });
resultSchema.index({ addedBy: 1 });

module.exports = mongoose.model('Result', resultSchema);

