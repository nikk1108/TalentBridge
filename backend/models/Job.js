const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true,
    default: 'Remote'
  },
  type: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  workplace: {
    type: String,
    required: true,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'Remote'
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Closed', 'Draft'],
    default: 'Active'
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: [String],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyWebsite: {
    type: String,
    trim: true,
    default: ''
  },
  companyLogoUrl: {
    type: String,
    trim: true,
    default: ''
  },
  salaryRange: {
    type: String,
    trim: true,
    default: ''
  },
  experienceLevel: {
    type: String,
    trim: true,
    default: 'Mid-Level'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);
