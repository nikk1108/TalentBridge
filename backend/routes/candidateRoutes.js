const express = require('express');
const router = express.Router();
const {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  addComment,
  editComment,
  deleteComment,
  uploadResume,
  getDashboardData,
  parseResumeData
} = require('../controllers/candidateController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect); // Secure all candidate routes

// Dashboard metrics
router.get('/dashboard', getDashboardData);

// Resume upload & parsing routes
router.post('/upload-resume', upload.single('resume'), uploadResume);
router.post('/parse-resume', parseResumeData);

// Comments management routes
router.post('/:id/comments', addComment);
router.put('/:id/comments/:commentId', editComment);
router.delete('/:id/comments/:commentId', deleteComment);

// Core candidate CRUD routes
router.route('/')
  .get(getCandidates)
  .post(createCandidate);

router.route('/:id')
  .get(getCandidateById)
  .put(updateCandidate)
  .delete(deleteCandidate);

module.exports = router;
