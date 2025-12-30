const User = require('../models/User');
const crypto = require('crypto');
const transporter = require('../config/email');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profileImages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).single('profileImage');

// Update profile (name, email, username)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log('📝 Update profile request for user:', userId);
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in token'
      });
    }

    const { username, email, fullName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (fullName) user.fullName = fullName;

    await user.save();

    console.log('✅ Profile updated successfully');
    res.json({
      message: 'Profile updated successfully',
      user: user.getProfile()
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Username or email already exists',
        message: 'This username or email is already taken.'
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update profile'
    });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err);
      return res.status(400).json({
        error: 'Upload error',
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select an image file.'
      });
    }

    try {
      const userId = req.user.id || req.user._id;
      console.log('📸 Upload image request for user:', userId);
      
      if (!userId) {
        // Delete uploaded file if no user ID
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User ID not found in token'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        // Delete uploaded file if user not found
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ 
          error: 'User not found',
          message: 'User not found'
        });
      }

      // Delete old profile image if exists
      if (user.profileImage) {
        try {
          const oldImagePath = user.profileImage.replace('http://localhost:3000/', '').replace(/\\/g, '/');
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old image:', deleteError.message);
        }
      }

      // Save new image path (use forward slashes for URL)
      const imagePath = req.file.path.replace(/\\/g, '/');
      user.profileImage = `http://localhost:3000/${imagePath}`;
      await user.save();

      console.log('✅ Profile image uploaded successfully');
      res.json({
        message: 'Profile image uploaded successfully',
        profileImage: user.profileImage
      });
    } catch (error) {
      console.error('❌ Upload profile image error:', error);
      // Delete uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (deleteError) {
          console.error('Failed to delete uploaded file:', deleteError);
        }
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Failed to upload profile image'
      });
    }
  });
};

// Send OTP to email (Student requests, Admin receives OTP)
exports.sendOTP = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    console.log('📧 Send OTP request for user:', userId, 'Role:', userRole);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User ID not found in token'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Find admin user to send OTP email
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin || !admin.email) {
      console.warn('⚠️ No admin user found or admin email not configured');
      // Still generate OTP but can't send email
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    console.log('🔑 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', new Date(otpExpiry).toISOString());
    console.log('👤 Student requesting reset:', user.username, user.fullName || user.email);

    // Store OTP in student's document (using resetPasswordToken field temporarily)
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    // Verify OTP was saved
    const savedUser = await User.findById(userId);
    console.log('💾 Saved OTP in DB:', savedUser.resetPasswordToken);
    console.log('✅ OTP saved successfully');

    // Send OTP email to ADMIN (not student)
    if (admin && admin.email) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'noreply@baselineacademy.com',
          to: admin.email,
          subject: 'Password Reset OTP Request - Student Password Reset',
          html: `
            <h2>Password Reset OTP Request</h2>
            <p><strong>Student Details:</strong></p>
            <ul>
              <li><strong>Name:</strong> ${user.fullName || user.username}</li>
              <li><strong>Username:</strong> ${user.username}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              ${user.studentId ? `<li><strong>Student ID:</strong> ${user.studentId}</li>` : ''}
              ${user.class ? `<li><strong>Class:</strong> ${user.class} ${user.section || ''}</li>` : ''}
            </ul>
            <hr>
            <p><strong>The OTP for this student's password reset is:</strong></p>
            <h1 style="color: #00335E; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 5px;">${otp}</h1>
            <p style="text-align: center;"><strong>Please share this OTP with the student.</strong></p>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p style="color: #666; font-size: 12px;">If you didn't receive this request, please ignore this email.</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully to admin:', admin.email);
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        console.warn('⚠️ Email not configured properly. OTP:', otp);
        console.warn('⚠️ Please share this OTP with the student manually:', otp);
      }
    } else {
      console.warn('⚠️ Admin email not found. OTP generated but not sent:', otp);
    }

    res.json({
      message: 'Password reset request sent to admin. Admin will provide you with the OTP.',
      // Don't send OTP to student - only admin has it
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to send OTP request'
    });
  }
};

// Reset password with OTP
exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log('🔐 Reset password request for user:', userId);
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in token'
      });
    }

    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({
        error: 'OTP and new password are required',
        message: 'OTP and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found'
      });
    }

    console.log('🔍 Verifying OTP...');
    console.log('📥 Received OTP:', otp);
    console.log('💾 Stored OTP:', user.resetPasswordToken);
    console.log('⏰ OTP expires at:', user.resetPasswordExpires ? new Date(user.resetPasswordExpires).toISOString() : 'Not set');
    console.log('⏰ Current time:', new Date().toISOString());
    console.log('🔢 OTP type check - Received:', typeof otp, 'Stored:', typeof user.resetPasswordToken);
    console.log('🔢 OTP comparison:', user.resetPasswordToken === otp);
    console.log('🔢 OTP string comparison:', String(user.resetPasswordToken) === String(otp));

    // Check if OTP exists
    if (!user.resetPasswordToken) {
      console.log('❌ No OTP found for user');
      return res.status(400).json({
        error: 'No OTP found',
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      console.log('❌ OTP expired');
      return res.status(400).json({
        error: 'OTP has expired',
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP (compare as strings to avoid type issues)
    const storedOTP = String(user.resetPasswordToken).trim();
    const receivedOTP = String(otp).trim();
    
    if (storedOTP !== receivedOTP) {
      console.log('❌ OTP mismatch');
      console.log('   Stored (length):', storedOTP.length, storedOTP);
      console.log('   Received (length):', receivedOTP.length, receivedOTP);
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    console.log('✅ OTP verified successfully');

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✅ Password reset successfully');
    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('❌ Reset password with OTP error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to reset password'
    });
  }
};

