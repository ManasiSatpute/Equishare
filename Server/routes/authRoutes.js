import express from 'express';
import { signup, login, forgotPassword, verifyOtp, resetPassword,upgradeToOwner } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js'; 
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
// router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/upgrade-to-owner', protect, upgradeToOwner);

export default router;
