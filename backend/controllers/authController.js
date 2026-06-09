const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbService = require('../models/dbService');
const aiService = require('../services/aiService');

// Generate Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role: role || 'candidate' }, process.env.JWT_SECRET || 'supersecretjwtkeyfortalentbridge', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user (recruiter or candidate)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please fill in all fields');
  }

  // Validate role
  const userRole = role === 'recruiter' ? 'recruiter' : 'candidate';

  // Check if user exists
  const userExists = await dbService.findUserByEmail(email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await dbService.createUser({
    name,
    email,
    password: hashedPassword,
    role: userRole
  });

  if (user) {
    res.status(201).json({
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'candidate',
      token: generateToken(user._id || user.id, user.role || 'candidate'),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await dbService.findUserByEmail(email);

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'candidate',
      token: generateToken(user._id || user.id, user.role || 'candidate'),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

/**
 * @desc    Get user data
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;
    const updatedUser = await dbService.updateProfile(userId, req.body, role);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const updatedUser = await dbService.saveJob(userId, req.params.jobId);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unsaveJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const updatedUser = await dbService.unsaveJob(userId, req.params.jobId);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = await dbService.getNotifications(userId);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const updatedUser = await dbService.markNotificationsAsRead(userId);
    res.status(200).json(updatedUser.notifications || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateAssessmentQuestions = async (req, res) => {
  try {
    const { skills } = req.body;
    const questions = await aiService.generateSkillQuestions(skills);
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const evaluateAssessmentAnswers = async (req, res) => {
  try {
    const { answers } = req.body;
    const result = await aiService.evaluateSkillAnswers(answers);
    
    // Notify user of completion
    await dbService.addNotification(req.user._id || req.user.id, `Skill Assessment complete. Diagnostic Match Score: ${result.score}%`);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
