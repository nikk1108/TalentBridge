const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  updateProfile, 
  saveJob, 
  unsaveJob, 
  getNotifications, 
  markNotificationsAsRead,
  generateAssessmentQuestions,
  evaluateAssessmentAnswers
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/save-job/:jobId', protect, saveJob);
router.delete('/save-job/:jobId', protect, unsaveJob);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsAsRead);

// Skill Assessment routes
router.post('/skills/assess/questions', protect, generateAssessmentQuestions);
router.post('/skills/assess/evaluate', protect, evaluateAssessmentAnswers);

module.exports = router;
