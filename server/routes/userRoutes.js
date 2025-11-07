const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  getUsers,
  updateUser,
  deleteUser,
  sendOTP,
  verifyOTP,
  resetPassword
} = require("../controller/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.get("/", getUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
