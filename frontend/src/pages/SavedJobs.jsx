import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Inbox, MapPin, Building2, DollarSign } from 'lucide-react';
import api from '../services/api';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSavedJobs = async () => {
    try {
      const data = await api.updateProfile({}); // We can fetch saved jobs using getSavedJobs or custom query
      // Let's call /api/auth/me and extract populated savedJobs details!
      const me = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
      setSavedJobs(me.savedJobs || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve bookmarked listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = async (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.unsaveJob(jobId);
      setSavedJobs(savedJobs.filter(j => j._id !== jobId));
    } catch (err) {
      alert(err.message || 'Failed to remove job bookmark');
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Loading saved openings...</div>;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
        Error loading saved jobs: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-7xl relative">
      <div className="border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Saved Jobs</h1>
        <p className="text-[11px] text-[#666]">Job openings bookmarked to apply later</p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-[#2a2a2a] rounded bg-[#161616] max-w-xl mx-auto my-6 w-full">
          <Bookmark size={24} className="text-[#444] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-white mb-1">No saved jobs</h3>
          <p className="text-[10px] text-[#666] mb-4">You have not bookmarked any jobs yet. Browse openings to save roles.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
          >
            Explore Active Roles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((job) => (
            <Link
              key={job._id}
              to={`/jobs/${job._id}`}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-[11px] text-[#888] font-mono mt-0.5">{job.companyName || 'Acme Corp'}</p>
                  </div>
                  <button
                    onClick={(e) => handleUnsave(e, job._id)}
                    title="Remove bookmark"
                    className="p-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-red-950/20 hover:border-red-500/20 text-[#888] hover:text-red-400 rounded transition-all"
                  >
                    <Bookmark size={12} className="fill-current text-amber-500 hover:text-red-400" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-[#2e2e2e]/40">
                  <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
                    <MapPin size={11} className="text-[#555]" />
                    <span>{job.location} ({job.workplace})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
                    <Building2 size={11} className="text-[#555]" />
                    <span>{job.department}</span>
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
                      <DollarSign size={11} className="text-[#555]" />
                      <span>{job.salaryRange}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 flex justify-end">
                <span className="text-[10px] text-amber-500 group-hover:underline">View specifications & apply →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
