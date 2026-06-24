const User = require('./User');
const Job = require('./Job');
const Candidate = require('./Candidate');
const { getIsMock, getMockStore } = require('../config/db');

// Generates a mock Hex ID (like MongoDB ObjectId)
const generateMockId = () => {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

const dbService = {
  // ==================== USER SERVICE ====================
  async findUserByEmail(email) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user ? { ...user } : null;
    }
    return await User.findOne({ email });
  },

  async findUserById(id) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u._id === id || u.id === id);
      return user ? { ...user } : null;
    }
    return await User.findById(id).select('-password').populate('savedJobs');
  },

  async createUser(userData) {
    if (getIsMock()) {
      const store = getMockStore();
      const id = generateMockId();
      const newUser = {
        _id: id,
        id: id,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'candidate',
        createdAt: new Date()
      };
      store.users.push(newUser);
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }
    const user = new User(userData);
    await user.save();
    const result = user.toObject();
    delete result.password;
    return result;
  },

  // ==================== JOB SERVICE ====================
  async findJobs(filters = {}) {
    if (getIsMock()) {
      const store = getMockStore();
      let jobs = [...store.jobs];

      // If recruiter filter, show only jobs owned by recruiter.
      // If user is candidate, they browse ALL active jobs (unless a specific recruiter filter is passed)
      if (filters.createdBy) {
        jobs = jobs.filter(j => j.createdBy === filters.createdBy);
      }
      if (filters.status) {
        jobs = jobs.filter(j => j.status === filters.status);
      }
      if (filters.companyName) {
        jobs = jobs.filter(j => (j.companyName || 'Company Not Specified').toLowerCase() === filters.companyName.toLowerCase());
      }
      if (filters.department) {
        jobs = jobs.filter(j => (j.department || '').toLowerCase() === filters.department.toLowerCase());
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        jobs = jobs.filter(j => 
          j.title.toLowerCase().includes(s) || 
          (j.companyName || 'Company Not Specified').toLowerCase().includes(s) ||
          (j.department || '').toLowerCase().includes(s)
        );
      }
      
      return jobs.map(j => {
        const appCount = store.candidates.filter(c => c.jobId === j._id).length;
        return { ...j, applicantCount: appCount };
      });
    }

    const mongooseQuery = {};
    if (filters.createdBy) mongooseQuery.createdBy = filters.createdBy;
    if (filters.status) mongooseQuery.status = filters.status;
    if (filters.companyName) mongooseQuery.companyName = filters.companyName;
    if (filters.department) mongooseQuery.department = filters.department;
    if (filters.search) {
      mongooseQuery.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { companyName: { $regex: filters.search, $options: 'i' } },
        { department: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(mongooseQuery).sort({ createdAt: -1 });
    
    const jobsWithCount = [];
    for (const job of jobs) {
      const appCount = await Candidate.countDocuments({ jobId: job._id });
      jobsWithCount.push({
        ...job.toObject(),
        applicantCount: appCount
      });
    }
    return jobsWithCount;
  },

  async findJobById(id) {
    if (getIsMock()) {
      const store = getMockStore();
      const job = store.jobs.find(j => j._id === id || j.id === id);
      return job ? { ...job } : null;
    }
    return await Job.findById(id);
  },

  async createJob(jobData) {
    if (getIsMock()) {
      const store = getMockStore();
      const id = generateMockId();
      const newJob = {
        _id: id,
        id: id,
        title: jobData.title,
        department: jobData.department,
        location: jobData.location || 'Remote',
        type: jobData.type || 'Full-time',
        workplace: jobData.workplace || 'Remote',
        status: jobData.status || 'Active',
        description: jobData.description,
        requirements: jobData.requirements || [],
        skills: jobData.skills || [],
        companyName: jobData.companyName || 'Company',
        companyWebsite: jobData.companyWebsite || '',
        companyLogoUrl: jobData.companyLogoUrl || '',
        salaryRange: jobData.salaryRange || '',
        experienceLevel: jobData.experienceLevel || 'Mid-Level',
        keywords: jobData.keywords || [],
        createdBy: jobData.createdBy,
        createdAt: new Date()
      };
      store.jobs.push(newJob);
      return { ...newJob };
    }
    const job = new Job(jobData);
    return await job.save();
  },

  async updateJob(id, jobData) {
    if (getIsMock()) {
      const store = getMockStore();
      const index = store.jobs.findIndex(j => j._id === id || j.id === id);
      if (index === -1) return null;
      store.jobs[index] = {
        ...store.jobs[index],
        ...jobData,
        updatedAt: new Date()
      };
      return { ...store.jobs[index] };
    }
    return await Job.findByIdAndUpdate(id, jobData, { new: true });
  },

  async deleteJob(id) {
    if (getIsMock()) {
      const store = getMockStore();
      const index = store.jobs.findIndex(j => j._id === id || j.id === id);
      if (index === -1) return false;
      store.jobs.splice(index, 1);
      store.candidates = store.candidates.filter(c => c.jobId !== id);
      return true;
    }
    const job = await Job.findByIdAndDelete(id);
    if (!job) return false;
    await Candidate.deleteMany({ jobId: id });
    return true;
  },

  // ==================== CANDIDATE SERVICE ====================
  async findCandidates(filters = {}) {
    if (getIsMock()) {
      const store = getMockStore();
      let candidates = [...store.candidates];

      if (filters.jobId) {
        candidates = candidates.filter(c => c.jobId === filters.jobId);
      }

      if (filters.candidateId) {
        // If candidate, they ONLY see their own applications
        candidates = candidates.filter(c => c.candidateId === filters.candidateId);
      } else if (filters.recruiter) {
        // If recruiter, they see candidates applied to jobs THEY created
        const recruiterJobIds = store.jobs.filter(j => j.createdBy === filters.recruiter).map(j => j._id);
        candidates = candidates.filter(c => recruiterJobIds.includes(c.jobId));
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        candidates = candidates.filter(c => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s));
      }

      return candidates.map(c => {
        const job = store.jobs.find(j => j._id === c.jobId);
        return {
          ...c,
          job: job ? { _id: job._id, title: job.title, department: job.department, companyName: job.companyName || 'Company Not Specified', createdBy: job.createdBy } : null
        };
      });
    }

    const mongooseQuery = {};
    if (filters.jobId) {
      mongooseQuery.jobId = filters.jobId;
    }

    if (filters.candidateId) {
      mongooseQuery.candidateId = filters.candidateId;
    } else if (filters.recruiter) {
      const recruiterJobs = await Job.find({ createdBy: filters.recruiter }).select('_id');
      const jobIds = recruiterJobs.map(j => j._id);
      mongooseQuery.jobId = { $in: jobIds };
    }

    if (filters.search) {
      mongooseQuery.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const candidates = await Candidate.find(mongooseQuery).populate('jobId', 'title department companyName createdBy').sort({ createdAt: -1 });
    return candidates.map(c => {
      const obj = c.toObject();
      obj.job = obj.jobId;
      return obj;
    });
  },

  async findCandidateById(id) {
    if (getIsMock()) {
      const store = getMockStore();
      const candidate = store.candidates.find(c => c._id === id || c.id === id);
      if (!candidate) return null;
      const job = store.jobs.find(j => j._id === candidate.jobId);
      const resolvedComments = (candidate.comments || []).map(co => {
        const authorUser = store.users.find(u => String(u._id) === String(co.author) || String(u.id) === String(co.author));
        return {
          ...co,
          author: authorUser ? { _id: authorUser._id, name: authorUser.name } : null
        };
      });
      const candUser = store.users.find(u => String(u._id) === String(candidate.candidateId) || String(u.id) === String(candidate.candidateId));
      return {
        ...candidate,
        candidateId: candUser ? { _id: candUser._id, name: candUser.name, email: candUser.email, profile: candUser.profile } : null,
        comments: resolvedComments,
        job: job ? { _id: job._id, title: job.title, department: job.department, companyName: job.companyName || 'Company Not Specified', skills: job.skills, requirements: job.requirements, createdBy: job.createdBy } : null
      };
    }
    const candidate = await Candidate.findById(id)
      .populate('jobId')
      .populate('comments.author', 'name')
      .populate('candidateId', 'name email profile');
    if (!candidate) return null;
    const obj = candidate.toObject();
    obj.job = obj.jobId;
    return obj;
  },

  async checkDuplicateApplication(candidateId, jobId) {
    if (!candidateId) return false;
    if (getIsMock()) {
      const store = getMockStore();
      const exists = store.candidates.some(c => c.candidateId === candidateId && c.jobId === jobId);
      return exists;
    }
    const count = await Candidate.countDocuments({ candidateId, jobId });
    return count > 0;
  },

  async createCandidate(candidateData) {
    // 1. Prevent duplicate applications
    const isDuplicate = await this.checkDuplicateApplication(candidateData.candidateId, candidateData.jobId);
    if (isDuplicate) {
      throw new Error('Duplicate application detected. You have already applied for this job.');
    }

    if (getIsMock()) {
      const store = getMockStore();
      const id = generateMockId();
      const newCandidate = {
        _id: id,
        id: id,
        name: candidateData.name,
        email: candidateData.email,
        skills: candidateData.skills || [],
        resumeUrl: candidateData.resumeUrl || '',
        resumePath: candidateData.resumePath || '',
        jobId: candidateData.jobId,
        candidateId: candidateData.candidateId,
        matchScore: candidateData.matchScore || 0,
        matchStatus: candidateData.matchStatus || 'Weak Match',
        status: 'Applied',
        statusHistory: [{ status: 'Applied', updatedAt: new Date() }],
        comments: [],
        interviewNotes: '',
        notes: candidateData.notes || '',
        createdAt: new Date()
      };
      store.candidates.push(newCandidate);
      const job = store.jobs.find(j => j._id === newCandidate.jobId);
      return {
        ...newCandidate,
        job: job ? { _id: job._id, title: job.title, department: job.department, companyName: job.companyName || 'Company Not Specified', createdBy: job.createdBy } : null
      };
    }
    
    // Mongoose creation
    const candidate = new Candidate({
      ...candidateData,
      status: 'Applied',
      statusHistory: [{ status: 'Applied', updatedAt: new Date() }],
      comments: []
    });
    await candidate.save();
    const result = await Candidate.findById(candidate._id).populate('jobId', 'title department companyName createdBy');
    if (!result) return null;
    const obj = result.toObject();
    obj.job = obj.jobId;
    return obj;
  },

  async updateCandidate(id, candidateData) {
    if (getIsMock()) {
      const store = getMockStore();
      const index = store.candidates.findIndex(c => c._id === id || c.id === id);
      if (index === -1) return null;
      
      const current = store.candidates[index];
      const updatedHistory = [...(current.statusHistory || [])];

      // Track status transitions
      if (candidateData.status && candidateData.status !== current.status) {
        const existingIdx = updatedHistory.findIndex(h => h.status === candidateData.status);
        if (existingIdx !== -1) {
          updatedHistory.splice(existingIdx + 1);
        } else {
          updatedHistory.push({ status: candidateData.status, updatedAt: new Date() });
        }
      }

      store.candidates[index] = {
        ...current,
        ...candidateData,
        statusHistory: updatedHistory,
        updatedAt: new Date()
      };
      const job = store.jobs.find(j => j._id === store.candidates[index].jobId);
      return {
        ...store.candidates[index],
        job: job ? { _id: job._id, title: job.title, department: job.department, companyName: job.companyName || 'Company Not Specified', createdBy: job.createdBy } : null
      };
    }

    // Mongoose update status history
    const candidate = await Candidate.findById(id);
    if (!candidate) return null;

    if (candidateData.status && candidateData.status !== candidate.status) {
      const existingIdx = candidate.statusHistory.findIndex(h => h.status === candidateData.status);
      if (existingIdx !== -1) {
        candidate.statusHistory = candidate.statusHistory.slice(0, existingIdx + 1);
      } else {
        candidate.statusHistory.push({ status: candidateData.status, updatedAt: new Date() });
      }
    }

    // Assign other properties
    Object.keys(candidateData).forEach(key => {
      if (key !== 'statusHistory') {
        candidate[key] = candidateData[key];
      }
    });

    await candidate.save();
    const result = await Candidate.findById(id).populate('jobId', 'title department companyName createdBy');
    if (!result) return null;
    const obj = result.toObject();
    obj.job = obj.jobId;
    return obj;
  },

  async deleteCandidate(id) {
    if (getIsMock()) {
      const store = getMockStore();
      const index = store.candidates.findIndex(c => c._id === id || c.id === id);
      if (index === -1) return false;
      store.candidates.splice(index, 1);
      return true;
    }
    const candidate = await Candidate.findByIdAndDelete(id);
    return !!candidate;
  },

  // ==================== COMMENTS MANAGEMENT ====================
  async addComment(candidateId, text, rating, authorId) {
    if (getIsMock()) {
      const store = getMockStore();
      const candidate = store.candidates.find(c => c._id === candidateId || c.id === candidateId);
      if (!candidate) return null;
      
      const commentId = generateMockId();
      const newComment = {
        _id: commentId,
        id: commentId,
        text,
        rating: Number(rating) || 5,
        author: authorId,
        createdAt: new Date()
      };
      candidate.comments = candidate.comments || [];
      candidate.comments.push(newComment);
      
      const authorUser = store.users.find(u => u._id === authorId || u.id === authorId);
      return {
        ...newComment,
        author: authorUser ? { _id: authorUser._id, name: authorUser.name } : null
      };
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return null;
    candidate.comments.push({ text, rating: Number(rating) || 5, author: authorId });
    await candidate.save();
    
    const populated = await Candidate.findById(candidateId).populate('comments.author', 'name');
    return populated.comments[populated.comments.length - 1];
  },

  async editComment(candidateId, commentId, text, rating) {
    if (getIsMock()) {
      const store = getMockStore();
      const candidate = store.candidates.find(c => c._id === candidateId || c.id === candidateId);
      if (!candidate) return null;
      
      const comment = candidate.comments.find(co => co._id === commentId || co.id === commentId);
      if (!comment) return null;
      comment.text = text;
      if (rating !== undefined) comment.rating = Number(rating);
      
      const authorUser = store.users.find(u => u._id === comment.author || u.id === comment.author);
      return {
        ...comment,
        author: authorUser ? { _id: authorUser._id, name: authorUser.name } : null
      };
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return null;
    const comment = candidate.comments.id(commentId);
    if (!comment) return null;
    comment.text = text;
    if (rating !== undefined) comment.rating = Number(rating);
    await candidate.save();
    
    const populated = await Candidate.findById(candidateId).populate('comments.author', 'name');
    return populated.comments.id(commentId);
  },

  async deleteComment(candidateId, commentId) {
    if (getIsMock()) {
      const store = getMockStore();
      const candidate = store.candidates.find(c => c._id === candidateId || c.id === candidateId);
      if (!candidate) return false;
      
      const index = candidate.comments.findIndex(co => co._id === commentId || co.id === commentId);
      if (index === -1) return false;
      candidate.comments.splice(index, 1);
      return true;
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return false;
    candidate.comments.pull(commentId);
    await candidate.save();
    return true;
  },

  // ==================== DASHBOARD METRICS SERVICE ====================
  async getDashboardMetrics(userId, role) {
    if (getIsMock()) {
      const store = getMockStore();

      if (role === 'recruiter') {
        const recruiterJobs = store.jobs.filter(j => j.createdBy === userId);
        const recruiterJobIds = recruiterJobs.map(j => j._id);
        const activeJobs = recruiterJobs.filter(j => j.status === 'Active');
        
        const candidates = store.candidates.filter(c => recruiterJobIds.includes(c.jobId));
        const interviewsScheduled = candidates.filter(c => c.status === 'Interview Scheduled' || c.status === 'Interviewing').length;
        const offersSent = candidates.filter(c => c.status === 'Offered').length;
        const hires = candidates.filter(c => c.status === 'Hired').length;
        
        return {
          totalJobs: recruiterJobs.length,
          activeJobs: activeJobs.length,
          totalCandidates: candidates.length,
          interviewsScheduled,
          offersSent,
          hires
        };
      } else {
        // Candidate metrics
        const applications = store.candidates.filter(c => c.candidateId === userId);
        const screening = applications.filter(c => c.status === 'Screening').length;
        const interviewScheduled = applications.filter(c => c.status === 'Interview Scheduled').length;
        const interviewing = applications.filter(c => c.status === 'Interviewing').length;
        const offers = applications.filter(c => c.status === 'Offered' || c.status === 'Hired').length;
        const rejections = applications.filter(c => c.status === 'Rejected').length;
        
        const totalScores = applications.reduce((sum, c) => sum + (c.matchScore || 0), 0);
        const avgMatchScore = applications.length > 0 ? Math.round(totalScores / applications.length) : 0;

        return {
          appliedJobs: applications.length,
          screening,
          interviewScheduled,
          interviewing,
          offers,
          rejections,
          avgMatchScore
        };
      }
    }

    if (role === 'recruiter') {
      const recruiterJobs = await Job.find({ createdBy: userId }).select('_id status');
      const jobIds = recruiterJobs.map(j => j._id);
      const activeJobs = recruiterJobs.filter(j => j.status === 'Active').length;
      
      const totalCandidates = await Candidate.countDocuments({ jobId: { $in: jobIds } });
      const interviewsScheduled = await Candidate.countDocuments({ jobId: { $in: jobIds }, status: { $in: ['Interview Scheduled', 'Interviewing'] } });
      const offersSent = await Candidate.countDocuments({ jobId: { $in: jobIds }, status: 'Offered' });
      const hires = await Candidate.countDocuments({ jobId: { $in: jobIds }, status: 'Hired' });

      return {
        totalJobs: recruiterJobs.length,
        activeJobs,
        totalCandidates,
        interviewsScheduled,
        offersSent,
        hires
      };
    } else {
      // Candidate metrics Mongoose
      const applications = await Candidate.find({ candidateId: userId }).select('status matchScore');
      const appliedJobs = applications.length;
      const screening = applications.filter(c => c.status === 'Screening').length;
      const interviewScheduled = applications.filter(c => c.status === 'Interview Scheduled').length;
      const interviewing = applications.filter(c => c.status === 'Interviewing').length;
      const offers = applications.filter(c => c.status === 'Offered' || c.status === 'Hired').length;
      const rejections = applications.filter(c => c.status === 'Rejected').length;

      const totalScores = applications.reduce((sum, c) => sum + (c.matchScore || 0), 0);
      const avgMatchScore = appliedJobs > 0 ? Math.round(totalScores / appliedJobs) : 0;

      return {
        appliedJobs,
        screening,
        interviewScheduled,
        interviewing,
        offers,
        rejections,
        avgMatchScore
      };
    }
  },

  // ==================== ACTIVITY FEED SERVICE ====================
  async getActivityFeed(userId, role) {
    if (getIsMock()) {
      const store = getMockStore();
      const activity = [];

      if (role === 'recruiter') {
        const recruiterJobs = store.jobs.filter(j => j.createdBy === userId);
        const recruiterJobIds = recruiterJobs.map(j => j._id);

        // 1. New job postings created
        recruiterJobs.forEach(job => {
          activity.push({
            type: 'NEW_JOB',
            message: `New Job opening created: "${job.title}" (${job.department})`,
            createdAt: job.createdAt
          });
        });

        // 2. Recent applications
        const candidates = store.candidates.filter(c => recruiterJobIds.includes(c.jobId));
        candidates.forEach(cand => {
          const job = store.jobs.find(j => j._id === cand.jobId);
          activity.push({
            type: 'NEW_APP',
            message: `Candidate "${cand.name}" submitted an application for "${job ? job.title : 'Deleted Job'}"`,
            createdAt: cand.createdAt
          });

          // 3. Status changes (timeline history logs)
          if (cand.statusHistory && cand.statusHistory.length > 1) {
            cand.statusHistory.slice(1).forEach(hist => {
              activity.push({
                type: 'STATUS_CHANGE',
                message: `Candidate "${cand.name}" status updated to "${hist.status}" for "${job ? job.title : 'Deleted Job'}"`,
                createdAt: hist.updatedAt
              });
            });
          }
        });
      } else {
        // Candidate activity feed (only show their own history)
        const apps = store.candidates.filter(c => c.candidateId === userId);
        apps.forEach(cand => {
          const job = store.jobs.find(j => j._id === cand.jobId);
          activity.push({
            type: 'NEW_APP',
            message: `You applied for: "${job ? job.title : 'Deleted Job'}"`,
            createdAt: cand.createdAt
          });

          if (cand.statusHistory && cand.statusHistory.length > 1) {
            cand.statusHistory.slice(1).forEach(hist => {
              activity.push({
                type: 'STATUS_CHANGE',
                message: `Your application status for "${job ? job.title : 'Deleted Job'}" was updated to "${hist.status}"`,
                createdAt: hist.updatedAt
              });
            });
          }
        });
      }

      // Sort and slice
      return activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
    }

    const activity = [];
    if (role === 'recruiter') {
      const recruiterJobs = await Job.find({ createdBy: userId }).sort({ createdAt: -1 });
      const jobIds = recruiterJobs.map(j => j._id);

      recruiterJobs.forEach(job => {
        activity.push({
          type: 'NEW_JOB',
          message: `New Job opening created: "${job.title}" (${job.department})`,
          createdAt: job.createdAt
        });
      });

      const candidates = await Candidate.find({ jobId: { $in: jobIds } }).populate('jobId', 'title department').sort({ createdAt: -1 });
      candidates.forEach(cand => {
        activity.push({
          type: 'NEW_APP',
          message: `Candidate "${cand.name}" submitted an application for "${cand.jobId ? cand.jobId.title : 'Deleted Job'}"`,
          createdAt: cand.createdAt
        });

        if (cand.statusHistory && cand.statusHistory.length > 1) {
          cand.statusHistory.slice(1).forEach(hist => {
            activity.push({
              type: 'STATUS_CHANGE',
              message: `Candidate "${cand.name}" status updated to "${hist.status}" for "${cand.jobId ? cand.jobId.title : 'Deleted Job'}"`,
              createdAt: hist.updatedAt
            });
          });
        }
      });
    } else {
      // Candidate activity DB
      const applications = await Candidate.find({ candidateId: userId }).populate('jobId', 'title').sort({ createdAt: -1 });
      applications.forEach(cand => {
        activity.push({
          type: 'NEW_APP',
          message: `You applied for: "${cand.jobId ? cand.jobId.title : 'Deleted Job'}"`,
          createdAt: cand.createdAt
        });

        if (cand.statusHistory && cand.statusHistory.length > 1) {
          cand.statusHistory.slice(1).forEach(hist => {
            activity.push({
              type: 'STATUS_CHANGE',
              message: `Your application status for "${cand.jobId ? cand.jobId.title : 'Deleted Job'}" was updated to "${hist.status}"`,
              createdAt: hist.updatedAt
            });
          });
        }
      });
    }

    return activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  },

  // ==================== PROFILE & COMPANY SERVICE ====================
  async updateProfile(userId, data, role) {
    if (getIsMock()) {
      const store = getMockStore();
      const index = store.users.findIndex(u => u._id === userId || u.id === userId);
      if (index === -1) return null;
      
      const user = store.users[index];
      if (role === 'recruiter') {
        user.company = { ...user.company, ...data };
      } else {
        user.profile = { ...user.profile, ...data };
      }
      return { ...user };
    }
    
    const update = {};
    if (role === 'recruiter') {
      update.company = data;
    } else {
      update.profile = data;
    }
    
    return await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('-password');
  },

  // ==================== SAVED JOBS SERVICE ====================
  async saveJob(userId, jobId) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u._id === userId || u.id === userId);
      if (user) {
        user.savedJobs = user.savedJobs || [];
        if (!user.savedJobs.includes(jobId)) {
          user.savedJobs.push(jobId);
        }
      }
      return user;
    }
    return await User.findByIdAndUpdate(userId, { $addToSet: { savedJobs: jobId } }, { new: true }).select('-password');
  },

  async unsaveJob(userId, jobId) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u._id === userId || u.id === userId);
      if (user) {
        user.savedJobs = user.savedJobs || [];
        user.savedJobs = user.savedJobs.filter(id => String(id) !== String(jobId));
      }
      return user;
    }
    return await User.findByIdAndUpdate(userId, { $pull: { savedJobs: jobId } }, { new: true }).select('-password');
  },

  async getSavedJobs(userId) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u._id === userId || u.id === userId);
      if (!user) return [];
      const savedJobIds = user.savedJobs || [];
      return store.jobs.filter(j => savedJobIds.includes(j._id));
    }
    const user = await User.findById(userId).populate('savedJobs');
    return user ? user.savedJobs : [];
  },

  // ==================== NOTIFICATIONS SERVICE ====================
  async addNotification(userId, text) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u._id === userId || u.id === userId);
      if (user) {
        user.notifications = user.notifications || [];
        user.notifications.unshift({
          _id: generateMockId(),
          text,
          read: false,
          createdAt: new Date()
        });
      }
      return user;
    }
    return await User.findByIdAndUpdate(
      userId,
      { $push: { notifications: { $each: [{ text }], $position: 0 } } },
      { new: true }
    );
  },

  async getNotifications(userId) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u._id === userId || u.id === userId);
      return user ? user.notifications || [] : [];
    }
    const user = await User.findById(userId).select('notifications');
    return user ? user.notifications : [];
  },

  async markNotificationsAsRead(userId) {
    if (getIsMock()) {
      const store = getMockStore();
      const user = store.users.find(u => u._id === userId || u.id === userId);
      if (user && user.notifications) {
        user.notifications.forEach(n => n.read = true);
      }
      return user;
    }
    const user = await User.findById(userId);
    if (user) {
      user.notifications.forEach(n => n.read = true);
      await user.save();
    }
    return user;
  }
};

module.exports = dbService;
