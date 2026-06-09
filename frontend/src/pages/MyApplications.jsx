import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await api.getCandidates();
        setApplications(data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve application logs');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Offered':
      case 'Hired':
        return 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400';
      case 'Screening':
      case 'Interview Scheduled':
        return 'bg-amber-950/20 border-amber-500/20 text-amber-400';
      case 'Interviewing':
        return 'bg-rose-950/20 border-rose-500/20 text-rose-400';
      case 'Rejected':
        return 'bg-slate-800/25 border-slate-600/30 text-slate-400';
      default:
        return 'bg-slate-900 border-[#2e2e2e] text-[#a1a1aa]';
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Retrieving application history...</div>;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
        Error loading applications: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-7xl relative">
      <div className="border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">My Applications</h1>
        <p className="text-[11px] text-[#666]">Track job applications and progress statuses in real-time</p>
      </div>

      {applications.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-[#2a2a2a] rounded bg-[#161616] max-w-xl mx-auto my-6 w-full">
          <Inbox size={24} className="text-[#444] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-white mb-1">No applications submitted</h3>
          <p className="text-[10px] text-[#666] mb-4">You have not applied to any job listings on TalentBridge yet.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
          >
            Browse Job Listings
          </Link>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#161616] text-[9px] text-[#888] uppercase tracking-wider font-mono">
                  <th className="px-4 py-2.5 font-medium">Job Title</th>
                  <th className="px-4 py-2.5 font-medium">Company</th>
                  <th className="px-4 py-2.5 font-medium">Applied Date</th>
                  <th className="px-4 py-2.5 font-medium">Match Score</th>
                  <th className="px-4 py-2.5 font-medium">Current Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/40">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex flex-col">
                        <span>{app.job?.title || 'Unknown Role'}</span>
                        <div className="flex gap-1.5 items-center text-[9px] text-[#555] font-mono mt-0.5">
                          {app.job?.experienceLevel && <span>{app.job.experienceLevel}</span>}
                          {app.job?.experienceLevel && app.job?.salaryRange && <span>•</span>}
                          {app.job?.salaryRange && <span className="text-amber-500 font-medium">{app.job.salaryRange}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#a1a1aa] font-medium">
                      {app.job?.companyName || 'Acme Corp'}
                    </td>
                    <td className="px-4 py-3 text-[#888] font-mono">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        app.matchStatus === 'Excellent Match'
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                          : app.matchStatus === 'Good Match'
                          ? 'bg-amber-950/20 border-amber-500/20 text-amber-400'
                          : 'bg-[#2a2a2a] border-[#3c3c3c] text-[#888]'
                      }`}>
                        {app.matchScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(app.status)}`}>
                        {app.status || 'Applied'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/jobs/${app.jobId?._id || app.jobId}`}
                        className="px-2.5 py-1 bg-[#222] border border-[#2e2e2e] hover:bg-[#2a2a2a] text-[10px] font-medium rounded text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        View Job Specs
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
