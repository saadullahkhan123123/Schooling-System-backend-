const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalFees: {
    type: Number,
    required: true,
    default: 0
  },
  paidFees: {
    type: Number,
    required: true,
    default: 0
  },
  pendingFees: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Partial', 'Pending'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: String,
    receiptNumber: String,
    notes: String
  }],
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString()
  },
  month: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December']
  }
}, {
  timestamps: true
});

// Calculate pending fees before save
feeSchema.pre('save', function(next) {
  this.pendingFees = this.totalFees - this.paidFees;
  
  // Update status based on payment
  if (this.paidFees === 0) {
    this.status = 'Pending';
  } else if (this.paidFees >= this.totalFees) {
    this.status = 'Paid';
  } else {
    this.status = 'Partial';
  }
  
  next();
});

module.exports = mongoose.model('Fee', feeSchema);

