const express = require('express');
const router = express.Router();
const { getJobs, getJobById, createJob, updateJob, deleteJob, suggestDescription, generateQuestions } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all job routes

router.route('/')
  .get(getJobs)
  .post(createJob);

router.post('/suggest-jd', suggestDescription);
router.post('/:id/generate-questions', generateQuestions);

router.route('/:id')
  .get(getJobById)
  .put(updateJob)
  .delete(deleteJob);

module.exports = router;
