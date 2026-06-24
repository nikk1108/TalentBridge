const dbService = require('../models/dbService');
const aiService = require('../services/aiService');

/**
 * @desc    Get all jobs (filtered for recruiter ownership, or active jobs for candidate)
 * @route   GET /api/jobs
 * @access  Private
 */
const getJobs = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const { status, companyName, department, search } = req.query;

    let searchFilters = { status, companyName, department, search };

    if (userRole === 'recruiter') {
      // Recruiters only manage their own jobs
      searchFilters.createdBy = userId;
    } else {
      // Candidates can only see active job openings
      searchFilters.status = 'Active';
    }

    const jobs = await dbService.findJobs(searchFilters);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get job by ID
 * @route   GET /api/jobs/:id
 * @access  Private
 */
const getJobById = async (req, res) => {
  try {
    const job = await dbService.findJobById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(job.createdBy._id || job.createdBy);

    // If recruiter, check ownership
    if (userRole === 'recruiter' && jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to access this job' });
    }

    // If candidate, ensure the job is active
    if (userRole === 'candidate' && job.status !== 'Active') {
      return res.status(403).json({ message: 'Access denied. This job opening is closed.' });
    }

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a job
 * @route   POST /api/jobs
 * @access  Private
 */
const createJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Candidate users cannot publish job openings.' });
    }

    const { 
      title, 
      department, 
      location, 
      type, 
      workplace, 
      status, 
      description, 
      requirements, 
      skills, 
      companyName, 
      companyWebsite, 
      companyLogoUrl, 
      salaryRange,
      experienceLevel
    } = req.body;

    if (!title || !companyName || !description) {
      return res.status(400).json({ message: 'Please provide Title, Company Name, and Description' });
    }

    const recruiter = await dbService.findUserById(userId);
    const finalCompanyName = companyName || recruiter?.company?.name || recruiter?.name || 'Company';
    const finalCompanyWebsite = companyWebsite || recruiter?.company?.website || '';
    const finalCompanyLogoUrl = companyLogoUrl || recruiter?.company?.logo || '';

    const job = await dbService.createJob({
      title,
      department,
      location,
      type,
      workplace,
      status,
      description,
      requirements: Array.isArray(requirements) ? requirements : [],
      skills: Array.isArray(skills) ? skills : [],
      companyName: finalCompanyName,
      companyWebsite: finalCompanyWebsite,
      companyLogoUrl: finalCompanyLogoUrl,
      salaryRange: salaryRange || '',
      experienceLevel: experienceLevel || 'Mid-Level',
      createdBy: userId
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:id
 * @access  Private
 */
const updateJob = async (req, res) => {
  try {
    const job = await dbService.findJobById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(job.createdBy._id || job.createdBy);

    // Strict validation
    if (userRole !== 'recruiter' || jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to edit this job specification' });
    }

    const updatedJob = await dbService.updateJob(req.params.id, req.body);
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a job
 * @route   DELETE /api/jobs/:id
 * @access  Private
 */
const deleteJob = async (req, res) => {
  try {
    const job = await dbService.findJobById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const jobCreatorId = String(job.createdBy._id || job.createdBy);

    // Strict validation
    if (userRole !== 'recruiter' || jobCreatorId !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this job opening' });
    }

    await dbService.deleteJob(req.params.id);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Suggest job description based on title
 * @route   POST /api/jobs/suggest-jd
 * @access  Private
 */
const suggestDescription = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, companyName, department, skills, experience, employmentType, location, keywords } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    const suggestion = await aiService.generateJobDescription({
      title,
      companyName,
      department,
      skills,
      experience,
      employmentType,
      location,
      keywords
    });
    res.status(200).json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateQuestions = async (req, res) => {
  try {
    const job = await dbService.findJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const { title, description, skills } = job;
    const questions = await aiService.generateInterviewQuestions(title, description, skills);
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  suggestDescription,
  generateQuestions
};
