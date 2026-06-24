import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, Plus, Edit, Trash2, ArrowUpRight, Upload, Sparkles, Check } from 'lucide-react';
import api from '../services/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User context
  const user = api.getCurrentUser();
  const isRecruiter = user?.role === 'recruiter';

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companies, setCompanies] = useState([]);

  // Application Modal state
  const [activeApplyJob, setActiveApplyJob] = useState(null);
  const [candSkills, setCandSkills] = useState('');
  const [candNotes, setCandNotes] = useState('');
  const [candResumeFile, setCandResumeFile] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await api.getJobs({
        search,
        status,
        companyName
      });
      setJobs(res);

      if (!companyName && res.length > 0) {
        const comps = [...new Set(res.map(j => j.companyName || 'Company Not Specified'))].filter(Boolean);
        setCompanies(comps);
      }
    } catch (err) {
      setError(err.message || 'Failed to load jobs list');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!isRecruiter) {
      try {
        const apps = await api.getCandidates();
        const ids = apps.map(app => app.jobId._id || app.jobId);
        setAppliedJobIds(ids);
      } catch (err) {
        console.error('Error fetching applied jobs', err);
      }
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
  }, [search, status, companyName]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this job opening? All candidate applications linked to this job will be deleted permanently.');
    if (!confirm) return;

    try {
      await api.deleteJob(id);
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete job');
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!candResumeFile) {
      return setModalError('Please upload a PDF resume file to apply.');
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      // 1. Upload PDF resume
      const uploadRes = await api.uploadResume(candResumeFile);
      const resumePath = uploadRes.filePath;

      // 2. Submit candidate application
      await api.createCandidate({
        jobId: activeApplyJob._id,
        skills: candSkills,
        resumePath: resumePath,
        notes: candNotes
      });

      setModalSuccess('Application submitted successfully!');
      setAppliedJobIds([...appliedJobIds, activeApplyJob._id]);
      
      setTimeout(() => {
        setActiveApplyJob(null);
        setCandSkills('');
        setCandNotes('');
        setCandResumeFile(null);
        setModalSuccess('');
      }, 1500);

    } catch (err) {
      setModalError(err.message || 'Failed to submit application');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl relative">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white">
            {isRecruiter ? 'Manage Job Openings' : 'Browse Active Openings'}
          </h1>
          <p className="text-[11px] text-[#666]">
            {isRecruiter ? 'Configure and audit recruitment pipelines' : 'Explore roles and apply matching your background'}
          </p>
        </div>
        {isRecruiter && (
          <Link
            to="/jobs/new"
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            <span>New Opening</span>
          </Link>
        )}
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded p-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center flex-1">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#666]">
              <Search size={12} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, company, department..."
              className="w-full bg-[#121212] border border-[#2e2e2e] pl-8 pr-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#555]"
            />
          </div>

          {isRecruiter && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          )}

          <select
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
          >
            <option value="">All Companies</option>
            {companies.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[10px] text-[#666] font-mono">
          {jobs.length} roles found
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
          Error: {error}
        </div>
      )}

      {/* JOBS GRID */}
      {loading ? (
        <div className="text-xs font-mono text-[#888] animate-pulse">Retrieving job records...</div>
      ) : jobs.length > 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2e2e2e] bg-[#161616] text-[10px] text-[#888] uppercase tracking-wider font-mono">
                  <th className="px-4 py-2 font-medium">Job Title</th>
                   <th className="px-4 py-2 font-medium">Company</th>
                  <th className="px-4 py-2 font-medium">Location</th>
                  <th className="px-4 py-2 font-medium">Workplace</th>
                  <th className="px-4 py-2 font-medium">Salary</th>
                  {isRecruiter && <th className="px-4 py-2 font-medium">Applicants</th>}
                  {isRecruiter && <th className="px-4 py-2 font-medium">Status</th>}
                  <th className="px-4 py-2 font-medium text-right">
                    {isRecruiter ? 'Actions' : 'Application'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/50 text-xs">
                {jobs.map((job) => {
                  const hasApplied = appliedJobIds.includes(job._id);
                  return (
                    <tr key={job._id} className="hover:bg-[#222] transition-colors group">
                      <td className="px-4 py-2.5 font-medium text-white">
                        <div className="flex flex-col">
                          <Link to={`/jobs/${job._id}`} className="hover:text-amber-500 hover:underline">
                            {job.title}
                          </Link>
                          <div className="flex gap-2 items-center text-[9px] text-[#555] font-mono mt-0.5">
                            <span className="text-[#a1a1aa] font-sans font-medium">{job.companyName || 'Company Not Specified'}</span>
                            <span>•</span>
                            {job.experienceLevel && <span>{job.experienceLevel}</span>}
                            <span>•</span>
                            <span>ID: {job._id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[#a1a1aa]">
                        <div className="flex flex-col">
                          <span>{job.companyName || 'Company Not Specified'}</span>
                          {job.department && <span className="text-[9px] text-[#555] mt-0.5">{job.department}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[#a1a1aa]">{job.location}</td>
                      <td className="px-4 py-2.5 text-[#a1a1aa]">{job.workplace}</td>
                      <td className="px-4 py-2.5 text-amber-500 font-mono font-medium">{job.salaryRange || 'Competitive'}</td>
                      
                      {isRecruiter && (
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/candidates?jobId=${job._id}`}
                            className="text-amber-500 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <span>{job.applicantCount || 0}</span>
                            <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                      )}
                      
                      {isRecruiter && (
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                              job.status === 'Active'
                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                                : job.status === 'Draft'
                                ? 'bg-[#2a2a2a] border-[#3c3c3c] text-[#888]'
                                : 'bg-red-950/20 border-red-500/20 text-red-400'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-2.5 text-right">
                        {isRecruiter ? (
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/jobs/edit/${job._id}`}
                              title="Edit specification"
                              className="p-1 hover:bg-[#2a2a2a] rounded text-[#a1a1aa] hover:text-white transition-colors"
                            >
                              <Edit size={12} />
                            </Link>
                            <button
                              onClick={() => handleDelete(job._id)}
                              title="Delete opening"
                              className="p-1 hover:bg-[#2a2a2a] rounded text-[#a1a1aa] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            {hasApplied ? (
                              <span className="px-2 py-1 bg-[#222] border border-[#2e2e2e] text-[#666] text-[10px] rounded font-medium cursor-not-allowed select-none">
                                Already Applied
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setModalError('');
                                  setModalSuccess('');
                                  setActiveApplyJob(job);
                                }}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold transition-colors"
                              >
                                Apply Now
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* EMPTY STATE - NO JOBS FOUND */
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded p-8 text-center max-w-xl mx-auto my-6">
          <Briefcase size={24} className="text-[#444] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-white mb-1">No job openings found</h3>
          <p className="text-[10px] text-[#666] mb-3">
            {isRecruiter ? 'Create a job posting to configure your dashboard pipeline.' : 'No active roles are currently published. Check back later!'}
          </p>
          {isRecruiter && (
            <Link
              to="/jobs/new"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
            >
              Post First Job
            </Link>
          )}
        </div>
      )}

      {/* OVERLAY APPLICATION FORM MODAL (CANDIDATE ONLY) */}
      {activeApplyJob && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center font-sans p-4">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-5 flex flex-col justify-between shadow-2xl animate-in fade-in duration-200">
            <div>
              <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-2.5 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Submit Application: {activeApplyJob.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveApplyJob(null)}
                  className="text-xs text-[#888] hover:text-white px-2 py-0.5 rounded hover:bg-[#222]"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-2 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
                  Error: {modalError}
                </div>
              )}

              {modalSuccess && (
                <div className="mb-4 p-2 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <Check size={12} />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form id="apply-role-form" onSubmit={handleApplySubmit} className="flex flex-col gap-4">
                
                {/* Candidate Skill details */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">
                    My Skills <span className="text-[#555]">(comma-separated)</span>
                  </label>
                  <textarea
                    value={candSkills}
                    onChange={(e) => setCandSkills(e.target.value)}
                    rows={3}
                    placeholder="e.g. React, JavaScript, HTML5, CSS3, Tailwind CSS"
                    className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444] font-mono leading-relaxed"
                    required
                  />
                </div>

                {/* PDF Resume Uploader */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Upload Resume (PDF only)</label>
                  <div className="relative border border-dashed border-[#2e2e2e] bg-[#121212] rounded p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[#161616] transition-colors group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setCandResumeFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      required
                    />
                    <Upload size={14} className="text-[#555] group-hover:text-amber-500 transition-colors" />
                    <span className="text-[10px] text-[#888] font-mono select-none">
                      {candResumeFile ? candResumeFile.name : 'Click or Drag Resume PDF here'}
                    </span>
                    <span className="text-[8px] text-[#555] select-none">PDF file limit: 5MB</span>
                  </div>
                </div>

                {/* Application Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Cover Note (Optional)</label>
                  <textarea
                    value={candNotes}
                    onChange={(e) => setCandNotes(e.target.value)}
                    rows={3}
                    placeholder="Brief details or background context..."
                    className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444] font-sans"
                  />
                </div>

              </form>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[#2e2e2e]/50 pt-4 mt-5">
              <button
                type="button"
                onClick={() => setActiveApplyJob(null)}
                className="px-3 py-1.5 bg-transparent border border-[#2e2e2e] hover:bg-[#222] text-xs font-medium rounded text-[#a1a1aa] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="apply-role-form"
                disabled={modalLoading}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
              >
                {modalLoading ? 'Submitting File...' : 'Submit Application'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Jobs;
