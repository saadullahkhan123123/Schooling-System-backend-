const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  // Authentication fields
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "teacher"], default: "student" },
  
  // Profile image
  profileImage: { type: String },
  
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Student-specific fields (for attendance system)
  studentId: { 
    type: String, 
    unique: true,
    sparse: true // Allows null values for admin users
  },
  class: {
    type: String,
    required: function() { return this.role === 'student' && this.studentId; }
  },
  section: String,
  fullName: {
    type: String,
    required: function() { return this.role === 'student' && this.studentId; }
  },
  rollNumber: {
    type: Number,
    required: function() { return this.role === 'student' && this.studentId; }
  },
  parentName: String,
  parentPhone: String,
  address: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Update updatedAt timestamp before save
userSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

// Get student profile (without sensitive data)
userSchema.methods.getProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    profileImage: this.profileImage,
    studentId: this.studentId,
    class: this.class,
    section: this.section,
    fullName: this.fullName,
    rollNumber: this.rollNumber,
    parentName: this.parentName,
    parentPhone: this.parentPhone,
    address: this.address,
    dateOfBirth: this.dateOfBirth,
    gender: this.gender,
    createdAt: this.createdAt
  };
};

module.exports = model("User", userSchema);