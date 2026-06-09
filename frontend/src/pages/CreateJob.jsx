import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Save } from 'lucide-react';
import api from '../services/api';

const CreateJob = () => {
  const { id } = useParams(); // For edit mode
  const isEdit = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('Remote');
  const [type, setType] = useState('Full-time');
  const [workplace, setWorkplace] = useState('Remote');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [skills, setSkills] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level');

  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(isEdit);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchJob = async () => {
        try {
          const job = await api.getJob(id);
          setTitle(job.title);
          setDepartment(job.department);
          setLocation(job.location);
          setType(job.type);
          setWorkplace(job.workplace);
          setStatus(job.status);
          setDescription(job.description);
          setRequirements(job.requirements?.join('\n') || '');
          setSkills(job.skills?.join(', ') || '');
          setSalaryRange(job.salaryRange || '');
          setExperienceLevel(job.experienceLevel || 'Mid-Level');
        } catch (err) {
          setError(err.message || 'Failed to retrieve job details');
        } finally {
          setFetchingJob(false);
        }
      };
      fetchJob();
    }
  }, [id, isEdit]);

  // AI Job Description suggestion assistant
  const handleAiSuggest = async () => {
    if (!title) {
      return setError('Please enter a Job Title first so the AI can suggest relevant details.');
    }
    
    setError('');
    setAiLoading(true);
    try {
      const data = await api.suggestJD(title);
      setDescription(data.description);
      
      if (data.requirements && data.requirements.length > 0) {
        setRequirements(data.requirements.join('\n'));
      }
      if (data.skills && data.skills.length > 0) {
        setSkills(data.skills.join(', '));
      }
      setInfoMsg('⚡ Suggested job description and requirements successfully loaded.');
      setTimeout(() => setInfoMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to generate AI suggestion');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !department || !description) {
      return setError('Title, Department, and Description are required.');
    }

    setLoading(true);
    setError('');

    // Parse text areas
    const reqList = requirements
      .split('\n')
      .map(r => r.trim().replace(/^-\s*/, '')) // remove leading dashes
      .filter(Boolean);

    const skillList = skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const jobData = {
      title,
      department,
      location,
      type,
      workplace,
      status,
      description,
      requirements: reqList,
      skills: skillList,
      salaryRange,
      experienceLevel
    };

    try {
      if (isEdit) {
        await api.updateJob(id, jobData);
      } else {
        await api.createJob(jobData);
      }
      navigate('/jobs');
    } catch (err) {
      setError(err.message || 'Failed to save job opening');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingJob) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Retrieving job specification details...</div>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* Title & Navigation */}
      <div className="flex items-center gap-3 border-b border-[#2e2e2e]/50 pb-3">
        <Link to="/jobs" className="p-1 hover:bg-[#1a1a1a] rounded text-[#888] hover:text-white transition-colors">
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-white">{isEdit ? 'Edit Job Opening' : 'New Job Opening'}</h1>
          <p className="text-[11px] text-[#666]">Define role requirements and candidate qualification criteria</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
          Error: {error}
        </div>
      )}

      {infoMsg && (
        <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 rounded text-amber-400 text-xs font-mono">
          {infoMsg}
        </div>
      )}

      {/* FORM SHELL */}
      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded p-5 flex flex-col gap-4">
        
        {/* Row 1: Title & Suggest Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Job Title</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lead Backend Engineer"
                className="flex-1 bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
                required
              />
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 hover:text-amber-500 text-xs font-medium rounded text-[#e4e4e7] transition-all"
              >
                <Sparkles size={11} className={aiLoading ? 'animate-spin' : ''} />
                <span>{aiLoading ? 'Generating...' : 'Suggest JD'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering, Design"
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
              required
            />
          </div>
        </div>

        {/* Row 2: Workplace, Type, Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Workplace</label>
            <select
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Employment Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Pipeline Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Row 2.5: Salary Range & Experience Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Salary Range</label>
            <input
              type="text"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              placeholder="e.g. $120,000 - $140,000"
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="Entry-Level">Entry-Level</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
        </div>

        {/* Text Area 1: Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Role Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder="Outline role responsibilities and summary details..."
            className="w-full bg-[#121212] border border-[#2e2e2e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444] font-mono leading-relaxed"
            required
          />
        </div>

        {/* Row 3: Skills list and Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Key Skills */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">
              Core Skills <span className="text-[#666]">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. JavaScript, Go, AWS, Docker"
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
            />
          </div>

          {/* Job Requirements */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">
              Key Requirements <span className="text-[#666]">(one per line)</span>
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              placeholder="e.g. 3+ years experience with React&#10;BS in Computer Science"
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444] font-mono"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-[#2e2e2e]/50 pt-4 mt-2">
          <Link
            to="/jobs"
            className="px-3 py-1.5 bg-transparent border border-[#2e2e2e] hover:bg-[#222] text-xs font-medium rounded text-[#a1a1aa] hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
          >
            <Save size={12} />
            <span>{loading ? 'Saving...' : 'Save Job Specification'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateJob;
