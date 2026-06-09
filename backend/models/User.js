const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['recruiter', 'candidate'],
    default: 'candidate'
  },
  // Candidate Profile Details
  profile: {
    photo: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumePath: { type: String, default: '' },
    education: [
      {
        degree: String,
        school: String,
        year: String
      }
    ],
    experience: [
      {
        role: String,
        company: String,
        years: String
      }
    ],
    skills: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' }
  },
  // Recruiter Company Profile Details
  company: {
    name: { type: String, default: '' },
    logo: { type: String, default: '' },
    website: { type: String, default: '' },
    description: { type: String, default: '' },
    industry: { type: String, default: '' },
    size: { type: String, default: '' }
  },
  // Saved Jobs for Candidates
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  // Notifications for both roles
  notifications: [
    {
      text: { type: String, required: true },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
