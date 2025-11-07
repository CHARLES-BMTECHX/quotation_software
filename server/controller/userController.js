const User = require("../model/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail=require("../utils/sendEmail");
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Explicitly include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// In-memory OTP store (use Redis in production)
const otpStore = {};

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Step 1: Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 mins

    otpStore[email] = { otp, expires };

    await sendEmail(
      email,
      'Your OTP for Password Reset',
      `<h2>Your OTP: <strong style="font-size: 24px;">${otp}</strong></h2><p>Valid for 10 minutes.</p>`
    );

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Step 2: Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record) return res.status(400).json({ message: 'OTP not sent or expired' });
    if (record.expires < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // Generate short-lived token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    delete otpStore[email];

    res.json({ message: 'OTP verified', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Step 3: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password required' });

    const user = await User.findOne({ email: decoded.email }).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    user.markModified('password');
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};
// Forgot Password (update new password)
exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const user = await User.findOne({ email }).select("+password"); // Force include password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Set new password and force Mongoose to detect change
    user.password = newPassword;
    user.markModified("password"); // ← THIS FIXES THE BUG

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (Admin use)
exports.getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// Delete user
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

// Update user info
exports.updateUser = async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.name = name || user.name;
  user.email = email || user.email;
  await user.save();

  res.json({ message: "User updated successfully", user });
};
