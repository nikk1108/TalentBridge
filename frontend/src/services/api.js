const API_URL = ''; // Relative path because of Vite proxy

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch (e) {
      errorMsg = res.statusText || errorMsg;
    }
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    throw new Error(errorMsg);
  }
  return await res.json();
};

const api = {
  // Auth API
  async login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, _id: data._id, role: data.role || 'candidate' }));
    }
    return data;
  },

  async register(name, email, password, role) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, _id: data._id, role: data.role || 'candidate' }));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      const parsed = JSON.parse(user);
      if (parsed && !parsed.role) {
        parsed.role = 'candidate';
      }
      return parsed;
    } catch (e) {
      return null;
    }
  },

  // Jobs API
  async getJobs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.department) params.append('department', filters.department);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${API_URL}/api/jobs?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async getJob(id) {
    const res = await fetch(`${API_URL}/api/jobs/${id}`, {
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async createJob(jobData) {
    const res = await fetch(`${API_URL}/api/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData)
    });
    return await handleResponse(res);
  },

  async updateJob(id, jobData) {
    const res = await fetch(`${API_URL}/api/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(jobData)
    });
    return await handleResponse(res);
  },

  async deleteJob(id) {
    const res = await fetch(`${API_URL}/api/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // AI JD Suggestions API
  async suggestJD(title) {
    const res = await fetch(`${API_URL}/api/jobs/suggest-jd`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title })
    });
    return await handleResponse(res);
  },

  // Candidates API
  async getCandidates(filters = {}) {
    const params = new URLSearchParams();
    if (filters.jobId) params.append('jobId', filters.jobId);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${API_URL}/api/candidates?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async getCandidate(id) {
    const res = await fetch(`${API_URL}/api/candidates/${id}`, {
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async createCandidate(candidateData) {
    const res = await fetch(`${API_URL}/api/candidates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(candidateData)
    });
    return await handleResponse(res);
  },

  async updateCandidate(id, candidateData) {
    const res = await fetch(`${API_URL}/api/candidates/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(candidateData)
    });
    return await handleResponse(res);
  },

  async deleteCandidate(id) {
    const res = await fetch(`${API_URL}/api/candidates/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // PDF Resume Upload API
  async uploadResume(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('resume', file);

    const res = await fetch(`${API_URL}/api/candidates/upload-resume`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return await handleResponse(res);
  },

  // Comments API
  async addComment(candidateId, text, rating = 5) {
    const res = await fetch(`${API_URL}/api/candidates/${candidateId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, rating })
    });
    return await handleResponse(res);
  },

  async updateComment(candidateId, commentId, text, rating) {
    const res = await fetch(`${API_URL}/api/candidates/${candidateId}/comments/${commentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ text, rating })
    });
    return await handleResponse(res);
  },

  async deleteComment(candidateId, commentId) {
    const res = await fetch(`${API_URL}/api/candidates/${candidateId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Profile API
  async updateProfile(profileData) {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await handleResponse(res);
    // Update local storage user data
    const currentLocal = localStorage.getItem('user');
    if (currentLocal && data) {
      const parsed = JSON.parse(currentLocal);
      localStorage.setItem('user', JSON.stringify({
        ...parsed,
        profile: data.profile,
        company: data.company
      }));
    }
    return data;
  },

  // Saved Jobs API
  async saveJob(jobId) {
    const res = await fetch(`${API_URL}/api/auth/save-job/${jobId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async unsaveJob(jobId) {
    const res = await fetch(`${API_URL}/api/auth/save-job/${jobId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Notifications API
  async getNotifications() {
    const res = await fetch(`${API_URL}/api/auth/notifications`, {
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async markNotificationsAsRead() {
    const res = await fetch(`${API_URL}/api/auth/notifications/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Dashboard API
  async getDashboardData() {
    const res = await fetch(`${API_URL}/api/candidates/dashboard`, {
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Skill Assessment API
  async generateAssessmentQuestions(skills) {
    const res = await fetch(`${API_URL}/api/auth/skills/assess/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ skills })
    });
    return await handleResponse(res);
  },

  async evaluateAssessmentAnswers(answers) {
    const res = await fetch(`${API_URL}/api/auth/skills/assess/evaluate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answers })
    });
    return await handleResponse(res);
  },

  // AI Resume & Question Helpers
  async parseResume(filePath) {
    const res = await fetch(`${API_URL}/api/candidates/parse-resume`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ filePath })
    });
    return await handleResponse(res);
  },

  async generateInterviewQuestions(jobId) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/generate-questions`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await handleResponse(res);
  }
};

export default api;
