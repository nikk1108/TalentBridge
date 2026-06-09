const dbService = require('../models/dbService');
const aiService = require('../services/aiService');

/**
 * @desc    Get all candidates (filtered: recruiters see applicants for their jobs; candidates see their applications)
 * @route   GET /api/candidates
 * @access  Private
 */
const getCandidates = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const { jobId, search } = req.query;

    let filter = { jobId, search };

    if (userRole === 'recruiter') {
      filter.recruiter = userId;
    } else {
      filter.candidateId = userId;
    }

    const candidates = await dbService.findCandidates(filter);

    // If candidate, strip comments
    const result = candidates.map(c => {
      const obj = c.toObject ? c.toObject() : { ...c };
      if (userRole === 'candidate') {
        delete obj.comments;
      }
      return obj;
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get candidate by ID (with ownership checks and candidate sanitization)
 * @route   GET /api/candidates/:id
 * @access  Private
 */
const getCandidateById = async (req, res) => {
  try {
    const candidate = await dbService.findCandidateById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    
    // Check job creator ID and candidate owner ID
    const jobCreatorId = String(candidate.job?.createdBy?._id || candidate.job?.createdBy || '');
    const candidateOwnerId = String(candidate.candidateId?._id || candidate.candidateId || '');

    // Recruiters can only access candidates for their own jobs
    if (userRole === 'recruiter' && jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to review this candidate profile' });
    }

    // Candidates can only access their own profile
    if (userRole === 'candidate' && candidateOwnerId !== String(userId)) {
      return res.status(403).json({ message: 'Access denied to this profile' });
    }

    // Sanitize candidate payload
    const result = candidate.toObject ? candidate.toObject() : { ...candidate };
    if (userRole === 'candidate') {
      delete result.comments;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a candidate application & calculate AI Match Score
 * @route   POST /api/candidates
 * @access  Private
 */
const createCandidate = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    
    const { name, email, skills, resumeUrl, resumePath, jobId, notes } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Fetch the job to check requirements
    const job = await dbService.findJobById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Associated job posting not found' });
    }

    // Set candidate name and email based on profile if logged in as candidate
    let finalName = name;
    let finalEmail = email;
    let finalCandidateId = null;

    if (userRole === 'candidate') {
      finalName = req.user.name;
      finalEmail = req.user.email;
      finalCandidateId = userId;
    }

    if (!finalName || !finalEmail) {
      return res.status(400).json({ message: 'Please provide applicant Name and Email' });
    }

    // Heuristics matching score
    const skillList = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
    const aiMatch = await aiService.calculateMatchScore(skillList, job.skills, job.requirements);

    const candidate = await dbService.createCandidate({
      name: finalName,
      email: finalEmail,
      skills: skillList,
      resumeUrl: resumeUrl || '',
      resumePath: resumePath || '',
      jobId,
      candidateId: finalCandidateId,
      matchScore: aiMatch.score,
      matchStatus: aiMatch.status,
      notes: notes || ''
    });

    // Notify recruiter
    if (job.createdBy) {
      await dbService.addNotification(job.createdBy, `New application submitted by ${finalName} for "${job.title}"`);
    }

    res.status(201).json(candidate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Update candidate details, status, interview schedules, and notes
 * @route   PUT /api/candidates/:id
 * @access  Private
 */
const updateCandidate = async (req, res) => {
  try {
    const candidate = await dbService.findCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate application not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(candidate.job?.createdBy?._id || candidate.job?.createdBy || '');
    const candidateOwnerId = String(candidate.candidateId?._id || candidate.candidateId || '');

    // Recruiters must own the job
    if (userRole === 'recruiter' && jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to modify this application' });
    }

    // Candidates can only modify their own application
    if (userRole === 'candidate' && candidateOwnerId !== String(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let updatedFields = { ...req.body };

    // Format skills if changed
    if (req.body.skills) {
      updatedFields.skills = Array.isArray(req.body.skills)
        ? req.body.skills
        : req.body.skills.split(',').map(s => s.trim());
    }

    // Re-evaluate score if skills change
    if (req.body.skills) {
      const finalSkills = updatedFields.skills;
      const job = await dbService.findJobById(candidate.jobId._id || candidate.jobId);
      if (job) {
        const aiMatch = await aiService.calculateMatchScore(finalSkills, job.skills, job.requirements);
        updatedFields.matchScore = aiMatch.score;
        updatedFields.matchStatus = aiMatch.status;
      }
    }

    // Handle candidate attempting to change status/interview/comments (blocked)
    if (userRole === 'candidate') {
      delete updatedFields.status;
      delete updatedFields.comments;
      delete updatedFields.interviewDate;
      delete updatedFields.interviewNotes;
      delete updatedFields.interviewType;
      delete updatedFields.interviewerName;
      delete updatedFields.meetingLink;
    }

    // Notify candidate if status changes
    if (updatedFields.status && updatedFields.status !== candidate.status) {
      const candId = candidate.candidateId?._id || candidate.candidateId;
      if (candId) {
        const titleStr = candidate.job?.title || 'Job';
        await dbService.addNotification(candId, `Your application status for "${titleStr}" was updated to "${updatedFields.status}"`);
      }
    }

    const updatedCandidate = await dbService.updateCandidate(req.params.id, updatedFields);
    res.status(200).json(updatedCandidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete candidate profile
 * @route   DELETE /api/candidates/:id
 * @access  Private
 */
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await dbService.findCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(candidate.job?.createdBy?._id || candidate.job?.createdBy || '');
    const candidateOwnerId = String(candidate.candidateId?._id || candidate.candidateId || '');

    // Authorization checks
    if (userRole === 'recruiter' && jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this candidate application' });
    }
    if (userRole === 'candidate' && candidateOwnerId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await dbService.deleteCandidate(req.params.id);
    res.status(200).json({ message: 'Candidate application removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Add Recruiter Comment
 * @route   POST /api/candidates/:id/comments
 * @access  Private
 */
const addComment = async (req, res) => {
  try {
    const candidate = await dbService.findCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(candidate.job?.createdBy?._id || candidate.job?.createdBy || '');

    // Recruiters only
    if (userRole !== 'recruiter' || jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to write assessment notes' });
    }

    const { text, rating } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await dbService.addComment(req.params.id, text, rating, userId);
    
    // Notify candidate
    const candId = candidate.candidateId?._id || candidate.candidateId;
    if (candId) {
      const jobTitle = candidate.job?.title || 'Job';
      await dbService.addNotification(candId, `A recruiter added evaluation feedback to your application for "${jobTitle}"`);
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Edit Recruiter Comment
 * @route   PUT /api/candidates/:id/comments/:commentId
 * @access  Private
 */
const editComment = async (req, res) => {
  try {
    const candidate = await dbService.findCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(candidate.job?.createdBy?._id || candidate.job?.createdBy || '');

    if (userRole !== 'recruiter' || jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to edit these notes' });
    }

    const { text, rating } = req.body;
    const comment = await dbService.editComment(req.params.id, req.params.commentId, text, rating);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete Recruiter Comment
 * @route   DELETE /api/candidates/:id/comments/:commentId
 * @access  Private
 */
const deleteComment = async (req, res) => {
  try {
    const candidate = await dbService.findCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(candidate.job?.createdBy?._id || candidate.job?.createdBy || '');

    if (userRole !== 'recruiter' || jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const success = await dbService.deleteComment(req.params.id, req.params.commentId);
    if (!success) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Upload Resume PDF File
 * @route   POST /api/candidates/upload-resume
 * @access  Private
 */
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF resume file' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'File uploaded successfully',
      filePath,
      fileName: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get dashboard metrics, trend charts, and activity feeds (branched by role)
 * @route   GET /api/candidates/dashboard
 * @access  Private
 */
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    // 1. Get Core Metrics (Branched inside dbService)
    const metrics = await dbService.getDashboardMetrics(userId, userRole);

    // 2. Fetch jobs and candidates
    const jobs = await dbService.findJobs(userRole === 'recruiter' ? { createdBy: userId } : {});
    const candidates = await dbService.findCandidates(
      userRole === 'recruiter' ? { recruiter: userId } : { candidateId: userId }
    );

    // 3. Generate AI Hiring Insights (subtle and recruiter-only)
    let aiInsights = [];
    if (userRole === 'recruiter') {
      aiInsights = await aiService.generateHiringInsights(jobs, candidates);
    }

    // 4. Activity Feed (Chrono list)
    const activityFeed = await dbService.getActivityFeed(userId, userRole);

    // 5. Generate Charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      let index = currentMonthIndex - i;
      if (index < 0) index += 12;
      last6Months.push(months[index]);
    }

    const jobsByMonthMap = {};
    const appsByMonthMap = {};

    last6Months.forEach(m => {
      jobsByMonthMap[m] = 0;
      appsByMonthMap[m] = 0;
    });

    jobs.forEach(j => {
      const date = new Date(j.createdAt);
      const mName = months[date.getMonth()];
      if (jobsByMonthMap[mName] !== undefined) {
        jobsByMonthMap[mName]++;
      }
    });

    candidates.forEach(c => {
      const date = new Date(c.createdAt);
      const mName = months[date.getMonth()];
      if (appsByMonthMap[mName] !== undefined) {
        appsByMonthMap[mName]++;
      }
    });

    const jobsByMonth = last6Months.map((m, idx) => {
      const realCount = jobsByMonthMap[m];
      const mockBaseline = [2, 3, 5, 4, 6, 8][idx] || 2;
      return {
        month: m,
        count: realCount > 0 ? realCount : (userRole === 'recruiter' ? mockBaseline : 0)
      };
    });

    const applicationsTrend = last6Months.map((m, idx) => {
      const realCount = appsByMonthMap[m];
      const mockBaseline = [12, 19, 32, 28, 45, 62][idx] || 10;
      return {
        month: m,
        count: realCount > 0 ? realCount : (userRole === 'recruiter' ? mockBaseline : mockBaseline - 5)
      };
    });

    res.status(200).json({
      metrics,
      aiInsights,
      activityFeed,
      charts: {
        jobsByMonth,
        applicationsTrend
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const parseResumeData = async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ message: 'File path is required for parsing' });
    }

    const parsedData = await aiService.parseResume(filePath);
    res.status(200).json(parsedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
