const express = require('express');
const router = express.Router();

let authController;
try {
  authController = require('../controllers/authController');
  console.log("✅ authController loaded successfully");
} catch (err) {
  console.error("❌ authController failed to load:", err.message);
  authController = {};
}

const { protect } = require('../middleware/authMiddleware');

// Safe fallback handlers (prevents 404 silent failure)
const safeHandler = (fnName) => {
  return (req, res) => {
    if (!authController[fnName]) {
      return res.status(500).json({
        message: `${fnName} not available in controller`
      });
    }
    return authController[fnName](req, res);
  };
};

router.post('/register', safeHandler('registerUser'));
router.post('/login', safeHandler('loginUser'));
router.get('/me', protect, safeHandler('getMe'));
router.put('/profile', protect, safeHandler('updateProfile'));

router.post('/save-job/:jobId', protect, safeHandler('saveJob'));
router.delete('/save-job/:jobId', protect, safeHandler('unsaveJob'));

router.get('/notifications', protect, safeHandler('getNotifications'));
router.put('/notifications/read', protect, safeHandler('markNotificationsAsRead'));

router.post('/skills/assess/questions', protect, safeHandler('generateAssessmentQuestions'));
router.post('/skills/assess/evaluate', protect, safeHandler('evaluateAssessmentAnswers'));

module.exports = router;