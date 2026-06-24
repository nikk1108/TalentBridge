import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, UserPlus, Trash2, ArrowRight, User } from 'lucide-react';
import api from '../services/api';

const Candidates = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [jobId, setJobId] = useState(initialJobId);

  // Drawer Form State for "Add Candidate"
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newResumeUrl, setNewResumeUrl] = useState('');
  const [newJobId, setNewJobId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await api.getCandidates({
        search,
        jobId
      });
      setCandidates(res);
    } catch (err) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.getJobs();
      setJobs(res.filter(j => j.status === 'Active'));
    } catch (err) {
      console.error('Failed to load active jobs for candidate link', err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, jobId]);

  useEffect(() => {
    fetchJobs();
    if (initialJobId) {
      setJobId(initialJobId);
    }
  }, [searchParams]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to remove this candidate application? This action cannot be undone.');
    if (!confirm) return;

    try {
      await api.deleteCandidate(id);
      setCandidates(candidates.filter(c => c._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to remove candidate');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newJobId) {
      return setFormError('Name, Email, and Target Job are required fields.');
    }

    setFormLoading(true);
    setFormError('');

    try {
      const newCandidate = await api.createCandidate({
        name: newName,
        email: newEmail,
        skills: newSkills,
        resumeUrl: newResumeUrl,
        jobId: newJobId,
        notes: newNotes
      });

      setCandidates([newCandidate, ...candidates]);
      
      setNewName('');
      setNewEmail('');
      setNewSkills('');
      setNewResumeUrl('');
      setNewJobId('');
      setNewNotes('');
      setIsDrawerOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create candidate profile');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl relative">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white">Candidates & Applications</h1>
          <p className="text-[11px] text-[#666]">Review match metrics and resumes for active job submissions</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
        >
          <UserPlus size={13} />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* FILTERS */}
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
              placeholder="Search by candidate name, email..."
              className="w-full bg-[#121212] border border-[#2e2e2e] pl-8 pr-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#555]"
            />
          </div>

          <select
            value={jobId}
            onChange={(e) => {
              setJobId(e.target.value);
              setSearchParams(e.target.value ? { jobId: e.target.value } : {});
            }}
            className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
          >
            <option value="">All Job Postings</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title} ({job.department})
              </option>
            ))}
          </select>
        </div>

        <div className="text-[10px] text-[#666] font-mono">
          {candidates.length} profiles listed
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
          Error: {error}
        </div>
      )}

      {/* TABLE DATA */}
      {loading ? (
        <div className="text-xs font-mono text-[#888] animate-pulse">Loading candidates database...</div>
      ) : candidates.length > 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2e2e2e] bg-[#161616] text-[10px] text-[#888] uppercase tracking-wider font-mono">
                  <th className="px-4 py-2 font-medium">Candidate Info</th>
                  <th className="px-4 py-2 font-medium">Applied Position</th>
                  <th className="px-4 py-2 font-medium">Match Status</th>
                  <th className="px-4 py-2 font-medium">Application Status</th>
                  <th className="px-4 py-2 font-medium text-right">Profile View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/50 text-xs">
                {candidates.map((cand) => (
                  <tr key={cand._id} className="hover:bg-[#222] transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{cand.name}</span>
                        <span className="text-[10px] text-[#666] font-mono mt-0.5">{cand.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#a1a1aa]">
                      {cand.job ? (
                        <div className="flex flex-col">
                          <span>{cand.job.title}</span>
                          <span className="text-[9px] text-[#666] font-medium mt-0.5">
                            {cand.job.companyName || 'Company Not Specified'}
                            {cand.job.department && <span className="text-[#555] font-normal"> – {cand.job.department}</span>}
                          </span>
                        </div>
                      ) : (
                        <span className="text-red-400 text-[10px]">Unassigned Job</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                            cand.matchStatus === 'Excellent Match'
                              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                              : cand.matchStatus === 'Good Match'
                              ? 'bg-amber-950/20 border-amber-500/20 text-amber-400'
                              : 'bg-[#2a2a2a] border-[#3c3c3c] text-[#888]'
                          }`}
                        >
                          {cand.matchScore}%
                        </span>
                        <span className="text-[10px] text-[#666] font-medium">{cand.matchStatus}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                          cand.status === 'Offered'
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                            : cand.status === 'Interviewing'
                            ? 'bg-blue-950/20 border-blue-500/20 text-blue-400'
                            : cand.status === 'Rejected'
                            ? 'bg-red-950/20 border-red-500/20 text-red-400'
                            : 'bg-[#2a2a2a] border-[#3c3c3c] text-[#888]'
                        }`}
                      >
                        {cand.status || 'Applied'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          to={`/candidates/${cand._id}`}
                          className="px-2 py-0.5 bg-[#222] border border-[#2e2e2e] hover:bg-[#2a2a2a] text-[#e4e4e7] rounded text-[10px] font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Review Dossier</span>
                          <ArrowRight size={10} />
                        </Link>
                        <button
                          onClick={() => handleDelete(cand._id)}
                          className="p-1 hover:bg-[#2a2a2a] rounded text-[#a1a1aa] hover:text-red-400 transition-colors"
                          title="Delete application"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* EMPTY STATE - NO CANDIDATES FOUND */
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded p-8 text-center max-w-xl mx-auto my-6">
          <User size={24} className="text-[#444] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-white mb-1">No candidate files found</h3>
          <p className="text-[10px] text-[#666] mb-4">No candidates have applied to your active postings yet.</p>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#222] border border-[#2e2e2e] hover:bg-[#2a2a2a] text-[#e4e4e7] rounded text-xs font-medium transition-colors"
          >
            Log Sourced Candidate
          </button>
        </div>
      )}

      {/* DRAWER FOR ADDING CANDIDATE */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end font-sans transition-all">
          <div className="w-full max-w-md bg-[#1a1a1a] border-l border-[#2e2e2e] h-full p-5 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div>
              <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <UserPlus size={13} className="text-amber-500" />
                  <span>Log Candidate Record</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-xs text-[#888] hover:text-white px-2 py-0.5 rounded hover:bg-[#222]"
                >
                  ✕ Close
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
                  Error: {formError}
                </div>
              )}

              <form id="add-candidate-form" onSubmit={handleAddCandidate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Candidate Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Johnathan Doe"
                    className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="j.doe@domain.com"
                    className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Target Job Opening</label>
                  <select
                    value={newJobId}
                    onChange={(e) => setNewJobId(e.target.value)}
                    className="bg-[#121212] border border-[#2e2e2e] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
                    required
                  >
                    <option value="">Select an active opening</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title} – {job.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">
                    Core Skills <span className="text-[#666]">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="React, TypeScript, CSS3"
                    className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Resume Link</label>
                  <input
                    type="url"
                    value={newResumeUrl}
                    onChange={(e) => setNewResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/resume"
                    className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Assessment Note</label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={4}
                    placeholder="Sourced via LinkedIn..."
                    className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444] font-sans"
                  />
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#2e2e2e]/50 pt-4 mt-5">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-3 py-1.5 bg-transparent border border-[#2e2e2e] hover:bg-[#222] text-xs font-medium rounded text-[#a1a1aa] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-candidate-form"
                disabled={formLoading}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
              >
                {formLoading ? 'Adding...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Candidates;
