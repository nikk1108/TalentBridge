const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  skills: {
    type: [String],
    default: []
  },
  resumeUrl: {
    type: String,
    trim: true,
    default: ''
  },
  resumePath: {
    type: String,
    trim: true,
    default: ''
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  matchStatus: {
    type: String,
    enum: ['Excellent Match', 'Good Match', 'Weak Match'],
    default: 'Weak Match'
  },
  status: {
    type: String,
    enum: ['Applied', 'Screening', 'Interview Scheduled', 'Interviewing', 'Offered', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  comments: [
    {
      text: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  interviewDate: {
    type: Date
  },
  interviewNotes: {
    type: String,
    default: ''
  },
  interviewType: {
    type: String,
    enum: ['Online', 'Phone', 'On-site'],
    default: 'Online'
  },
  interviewerName: {
    type: String,
    default: ''
  },
  meetingLink: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
