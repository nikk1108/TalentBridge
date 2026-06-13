import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Briefcase, 
  Users, 
  FileText, 
  Calendar, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  BookOpen, 
  Bookmark, 
  ChevronRight, 
  Video, 
  Phone, 
  MapPin 
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const user = api.getCurrentUser();
  const isRecruiter = user?.role === 'recruiter';

  const fetchDashboardData = async () => {
    try {
      const dashboardRes = await api.getDashboardData();
      setData(dashboardRes);
      
      const appRes = await api.getCandidates();
      setApplications(appRes);

      const activeJobs = await api.getJobs();
      setJobs(activeJobs.filter(j => j.status === 'Active'));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Initializing dashboard metrics...</div>;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
        Error: {error}
      </div>
    );
  }

  const { metrics, aiInsights, activityFeed } = data || {
    metrics: {},
    aiInsights: [],
    activityFeed: []
  };

  // Status mapping colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Offered':
      case 'Hired':
        return 'text-emerald-400 bg-emerald-950/20 border border-emerald-500/20';
      case 'Screening':
      case 'Interview Scheduled':
        return 'text-amber-400 bg-amber-950/20 border border-amber-500/20';
      case 'Interviewing':
        return 'text-rose-400 bg-rose-950/20 border border-rose-500/20';
      case 'Rejected':
        return 'text-slate-400 bg-slate-800/20 border border-slate-600/20';
      default:
        return 'text-[#888] bg-[#2a2a2a] border border-[#3c3c3c]';
    }
  };

  const getInterviewIcon = (type) => {
    switch (type) {
      case 'Online':
        return <Video size={12} className="text-emerald-400" />;
      case 'Phone':
        return <Phone size={12} className="text-amber-500" />;
      default:
        return <MapPin size={12} className="text-[#a1a1aa]" />;
    }
  };

  const getCountdownText = (dateStr) => {
    const now = new Date();
    const target = new Date(dateStr);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "Interview occurred";
    } else if (diffDays === 0) {
      return "Interview is today";
    } else if (diffDays === 1) {
      return "Interview tomorrow";
    } else {
      return `Interview in ${diffDays} days`;
    }
  };

  // ==================== CANDIDATE DASHBOARD ====================
  if (!isRecruiter) {
    const candidateApps = applications;
    
    // 1. Upcoming Interview loops
    const candidateInterviews = candidateApps.filter(app => app.interviewDate && new Date(app.interviewDate) >= new Date());
    const nextInterview = candidateInterviews.sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))[0];

    // 2. Profile completion strength
    const profile = user?.profile || {};
    let strengthScore = 0;
    if (profile.photo) strengthScore += 10;
    if (profile.resumePath || profile.resumeUrl) strengthScore += 25;
    if (profile.skills?.length > 0) strengthScore += 15;
    if (profile.softSkills?.length > 0) strengthScore += 10;
    if (profile.experience?.length > 0) strengthScore += 15;
    if (profile.education?.length > 0) strengthScore += 15;
    if (profile.linkedinUrl) strengthScore += 5;
    if (profile.githubUrl || profile.portfolioUrl) strengthScore += 5;

    // 3. Recommended jobs based on tech skills match
    const candidateTechSkills = profile.skills || [];
    const recommendedJobs = jobs.map(job => {
      const normalize = str => str.toLowerCase().replace(/[^a-z0-9#+]/g, '').trim();
      const normCand = candidateTechSkills.map(normalize);
      const matched = job.skills ? job.skills.filter(s => normCand.includes(normalize(s))) : [];
      const score = job.skills?.length > 0 ? Math.round((matched.length / job.skills.length) * 100) : 0;
      return { ...job, score };
    }).filter(j => j.score >= 30).sort((a, b) => b.score - a.score).slice(0, 3);

    return (
      <div className="flex flex-col gap-4 max-w-7xl relative">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-[#2e2e2e]/50 pb-3">
          <div>
            <h1 className="text-sm font-semibold text-white">Candidate Console</h1>
            <p className="text-[11px] text-[#666]">Monitor job applications, skill alignment indices, and interview loops</p>
          </div>
        </div>

        {/* 1. Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Applications', value: metrics.appliedJobs || 0, color: 'border-l-[#64748B]' },
            { label: 'Screening', value: metrics.screening || 0, color: 'border-l-[#F59E0B]' },
            { label: 'Scheduled', value: metrics.interviewScheduled || 0, color: 'border-l-[#64748B]' },
            { label: 'Interviewing', value: metrics.interviewing || 0, color: 'border-l-[#FB7185]' },
            { label: 'Offers', value: metrics.offers || 0, color: 'border-l-[#10B981]' },
            { label: 'Avg Match Score', value: `${metrics.avgMatchScore || 0}%`, color: 'border-l-[#10B981]' }
          ].map((m, idx) => (
            <div key={idx} className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3 flex flex-col justify-between h-20 border-l-4 ${m.color} hover:bg-[#222] transition-colors`}>
              <span className="text-[9px] font-mono text-[#888] uppercase tracking-wider">{m.label}</span>
              <div className="text-lg font-bold text-white mt-1 leading-none">{m.value}</div>
            </div>
          ))}
        </div>

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Column 1 & 2: Status progress & recommended jobs */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* Status Progress tracker list */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-t-2 border-t-[#64748B] rounded p-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#F59E0B] pl-2 block mb-3">
                Active Applications Track
              </span>
              {candidateApps.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[#2a2a2a] bg-[#141414] rounded">
                  <Inbox size={20} className="text-[#444] mx-auto mb-2" />
                  <p className="text-[10px] text-[#555] font-mono">No active applications found.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {candidateApps.slice(0, 3).map((app) => (
                    <div key={app._id} className="p-3 bg-[#141414] border border-[#2a2a2a] rounded flex flex-col gap-2 hover:bg-[#181818] transition-colors">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-white text-xs">{app.job?.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {['Applied', 'Screening', 'Interview Scheduled', 'Interviewing', 'Offered', 'Hired'].map((stage, idx) => {
                          const stages = ['Applied', 'Screening', 'Interview Scheduled', 'Interviewing', 'Offered', 'Hired'];
                          const currentIdx = stages.indexOf(app.status || 'Applied');
                          const active = currentIdx >= idx;
                          const isRejected = app.status === 'Rejected';
                          return (
                            <div key={idx} className="flex-1 flex flex-col gap-1">
                              <div className={`h-1.5 rounded-full ${
                                isRejected && active ? 'bg-[#FB7185]' : active ? 'bg-[#10B981]' : 'bg-[#222]'
                              }`}></div>
                              <span className="text-[8px] font-mono text-[#555] truncate text-center hidden sm:inline">{stage}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Jobs */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-t-2 border-t-[#10B981] rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#10B981] pl-2">
                  AI Recommended Roles
                </span>
                <Link to="/jobs" className="text-[10px] text-[#F59E0B] hover:underline font-mono">Browse all openings →</Link>
              </div>

              {recommendedJobs.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[#2a2a2a] bg-[#141414] rounded">
                  <Briefcase size={20} className="text-[#444] mx-auto mb-2" />
                  <p className="text-[10px] text-[#555] font-mono">Set up skills in profile to see role matches.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recommendedJobs.map((job) => (
                    <Link
                      key={job._id}
                      to={`/jobs/${job._id}`}
                      className="p-3 bg-[#141414] border border-[#2a2a2a] hover:border-[#10B981]/40 hover:bg-[#1a2e26]/10 rounded flex justify-between items-center text-xs group transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-[#10B981] transition-colors">{job.title}</h4>
                        <p className="text-[10px] text-[#666] font-mono mt-0.5">{job.companyName} – {job.department}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950/20 text-[#10B981] border border-emerald-500/20 font-mono text-[9px] rounded font-bold">
                        {job.score}% Match
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Column 3: Next interview, profile completion, activity feed */}
          <div className="flex flex-col gap-4">
            
            {/* Upcoming Interview */}
            <Link 
              to="/interview-center"
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 border-l-4 border-l-[#FB7185] border-t-2 border-t-[#FB7185] hover:bg-[#222]/10 hover:border-[#FB7185]/50 transition-all block cursor-pointer group"
            >
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#FB7185] pl-2 block mb-2.5 group-hover:text-[#FB7185] transition-colors">
                Upcoming Interview Loop
              </span>
              {nextInterview ? (
                <div className="p-3 bg-[#141414] border border-[#2a2a2a] rounded text-xs flex flex-col gap-2 hover:bg-[#181818] transition-colors">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-white">{nextInterview.job?.title}</span>
                    <span className="text-[9px] font-mono text-[#F59E0B] font-bold bg-amber-600/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {getCountdownText(nextInterview.interviewDate)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-1 text-[10px] text-[#a1a1aa] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-[#555]" />
                      <span>{new Date(nextInterview.interviewDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-[#555]" />
                      <span>{new Date(nextInterview.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getInterviewIcon(nextInterview.interviewType)}
                      <span className="text-[#F59E0B] hover:underline">Join Meeting</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-[#555] text-[10px] font-mono italic">
                  No upcoming interview loops.
                </div>
              )}
            </Link>

            {/* Profile Completion Score */}
            <Link 
              to="/resume-profile"
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 border-l-4 border-l-[#64748B] hover:bg-[#222]/10 hover:border-[#64748B]/50 transition-all block cursor-pointer group"
            >
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#64748B] pl-2 group-hover:text-[#F59E0B] transition-colors">
                  Profile Strength
                </span>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">{strengthScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mb-3">
                <div className="h-full bg-[#10B981] transition-all" style={{ width: `${strengthScore}%` }}></div>
              </div>
              {strengthScore < 100 ? (
                <span className="text-[10px] text-[#F59E0B] font-mono">Complete profile specifications →</span>
              ) : (
                <span className="text-[10px] text-[#10B981] font-medium font-mono">✓ Profile data fully logged.</span>
              )}
            </Link>

            {/* Candidate Activity Feed */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex-1 flex flex-col border-l-4 border-l-[#F59E0B]">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#F59E0B] pl-2 block mb-2.5">
                Recent Activity Logs
              </span>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {activityFeed.length === 0 ? (
                  <p className="text-[10px] text-[#555] font-mono italic">No actions recorded.</p>
                ) : (
                  activityFeed.slice(0, 5).map((act, idx) => (
                    <div key={idx} className="p-2 bg-[#141414] border border-[#2a2a2a] rounded text-[10px] flex flex-col gap-1 hover:bg-[#1c1c1c] transition-colors">
                      <span className="text-[#a1a1aa] leading-snug">{act.message}</span>
                      <span className="text-[8px] text-[#555] font-mono">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ==================== RECRUITER DASHBOARD ====================
  const recruiterCandidates = applications;
  const recentApplicants = recruiterCandidates.slice(0, 4);
  const scheduledInterviews = recruiterCandidates.filter(c => c.interviewDate && new Date(c.interviewDate) >= new Date()).slice(0, 3);

  // Compute hiring funnel counts
  const screeningCount = recruiterCandidates.filter(c => c.status === 'Screening').length;
  const scheduledCount = recruiterCandidates.filter(c => c.status === 'Interview Scheduled' || c.status === 'Interviewing').length;
  const offeredCount = recruiterCandidates.filter(c => c.status === 'Offered').length;
  const hiredCount = recruiterCandidates.filter(c => c.status === 'Hired').length;

  const totalFunnelCount = recruiterCandidates.length;

  return (
    <div className="flex flex-col gap-4 max-w-7xl relative">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e]/50 pb-3">
        <div>
          <h1 className="text-sm font-semibold text-white">Recruiter Console</h1>
          <p className="text-[11px] text-[#666]">Overview of company active pipelines and screening conversion metrics</p>
        </div>
      </div>

      {/* 1. KPIs Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Jobs', value: metrics.totalJobs || 0, color: 'border-l-[#64748B]' },
          { label: 'Active Openings', value: metrics.activeJobs || 0, color: 'border-l-[#10B981]' },
          { label: 'Total Applicants', value: metrics.totalCandidates || 0, color: 'border-l-[#64748B]' },
          { label: 'Loops Scheduled', value: metrics.interviewsScheduled || 0, color: 'border-l-[#FB7185]' },
          { label: 'Offers Sent', value: metrics.offersSent || 0, color: 'border-l-[#F59E0B]' },
          { label: 'Total Hires', value: metrics.hires || 0, color: 'border-l-[#10B981]' }
        ].map((m, idx) => (
          <div key={idx} className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3 flex flex-col justify-between h-20 border-l-4 ${m.color} hover:bg-[#222] transition-colors`}>
            <span className="text-[9px] font-mono text-[#888] uppercase tracking-wider">{m.label}</span>
            <div className="text-lg font-bold text-white mt-1 leading-none">{m.value}</div>
          </div>
        ))}
      </div>

      {/* 2. Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left column: Recent Applications list */}
        <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2a2a2a] border-t-2 border-t-[#10B981] rounded p-4 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#10B981] pl-2">
                Recent Applications
              </span>
              <Link to="/candidates" className="text-[10px] text-[#F59E0B] hover:underline font-mono">Manage applicants →</Link>
            </div>

            {recentApplicants.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-[#2a2a2a] bg-[#141414] rounded">
                <Users size={20} className="text-[#444] mx-auto mb-2" />
                <p className="text-[10px] text-[#555] font-mono">No submissions received yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] bg-[#161616] text-[9px] text-[#888] uppercase tracking-wider font-mono">
                      <th className="px-3 py-2 font-medium">Candidate</th>
                      <th className="px-3 py-2 font-medium">Job Title</th>
                      <th className="px-3 py-2 font-medium">Match %</th>
                      <th className="px-3 py-2 font-medium">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]/40">
                    {recentApplicants.map((cand) => (
                      <tr key={cand._id} className="hover:bg-[#222] transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-white">
                          <Link to={`/candidates/${cand._id}`} className="hover:text-[#F59E0B] transition-colors">{cand.name}</Link>
                        </td>
                        <td className="px-3 py-2.5 text-[#a1a1aa] truncate max-w-[150px]">{cand.job?.title || 'Unknown Role'}</td>
                        <td className="px-3 py-2.5 font-mono">{cand.matchScore}%</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${getStatusColor(cand.status)}`}>
                            {cand.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Upcoming loops & funnel stats */}
        <div className="flex flex-col gap-4">
          
          {/* Upcoming Interviews widget */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-t-2 border-t-[#FB7185] rounded p-4 border-l-4 border-l-[#FB7185]">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#FB7185] pl-2 block mb-2.5">
              Upcoming Loops Widget
            </span>
            {scheduledInterviews.length > 0 ? (
              <div className="flex flex-col gap-2">
                {scheduledInterviews.map((item) => (
                  <div key={item._id} className="p-2.5 bg-[#141414] border border-[#2a2a2a] rounded text-[10px] flex flex-col gap-1.5 hover:bg-[#181818] transition-colors">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[8px] font-mono text-[#F59E0B] bg-amber-600/10 px-1 py-0.5 rounded">
                        {getCountdownText(item.interviewDate)}
                      </span>
                    </div>
                    <div className="text-[#888] font-mono truncate">{item.job?.title}</div>
                    <div className="flex items-center justify-between text-[#555] font-mono text-[9px] border-t border-[#2e2e2e]/40 pt-1.5 mt-1">
                      <span>{new Date(item.interviewDate).toLocaleDateString()}</span>
                      {item.meetingLink && (
                        <a href={item.meetingLink} target="_blank" rel="noreferrer" className="text-[#F59E0B] hover:underline">Link</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#555] text-[10px] font-mono italic">
                No upcoming loops scheduled.
              </div>
            )}
          </div>

          {/* Simple funnel breakdown */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-t-2 border-t-[#64748B] rounded p-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono border-l-2 border-l-[#64748B] pl-2 block mb-3">
              Hiring Funnel (Stages)
            </span>
            <div className="flex flex-col gap-2 text-[10px]">
              {[
                { label: 'Screening', count: screeningCount, pct: totalFunnelCount > 0 ? Math.round((screeningCount / totalFunnelCount) * 100) : 0, color: 'bg-[#F59E0B]' },
                { label: 'Loops', count: scheduledCount, pct: totalFunnelCount > 0 ? Math.round((scheduledCount / totalFunnelCount) * 100) : 0, color: 'bg-[#FB7185]' },
                { label: 'Offered', count: offeredCount, pct: totalFunnelCount > 0 ? Math.round((offeredCount / totalFunnelCount) * 100) : 0, color: 'bg-[#10B981]' },
                { label: 'Hired', count: hiredCount, pct: totalFunnelCount > 0 ? Math.round((hiredCount / totalFunnelCount) * 100) : 0, color: 'bg-[#10B981]' }
              ].map((stage, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline font-mono text-[#a1a1aa]">
                    <span>{stage.label}</span>
                    <span>{stage.count} ({stage.pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#121212] border border-[#2e2e2e] rounded-sm overflow-hidden">
                    <div className={`h-full ${stage.color}`} style={{ width: `${stage.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
