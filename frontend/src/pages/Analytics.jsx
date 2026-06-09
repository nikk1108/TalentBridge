import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, Award, Briefcase } from 'lucide-react';
import api from '../services/api';

const Analytics = () => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalyticsData = async () => {
    try {
      const activeJobs = await api.getJobs();
      setJobs(activeJobs);
      
      const allCandidates = await api.getCandidates();
      setCandidates(allCandidates);
    } catch (err) {
      setError('Failed to retrieve analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Aggregating database statistics...</div>;
  }

  // 1. Applications per Job
  const appPerJob = jobs.map(j => {
    const count = candidates.filter(c => String(c.jobId?._id || c.jobId) === String(j._id)).length;
    return { title: j.title, count };
  }).sort((a, b) => b.count - a.count);

  // 2. Conversion Calculations
  const totalApps = candidates.length;
  const screening = candidates.filter(c => c.status === 'Screening').length;
  const scheduled = candidates.filter(c => c.status === 'Interview Scheduled' || c.status === 'Interviewing').length;
  const offered = candidates.filter(c => c.status === 'Offered').length;
  const hired = candidates.filter(c => c.status === 'Hired').length;

  const interviewConversionRate = totalApps > 0 ? Math.round((scheduled / totalApps) * 100) : 0;
  const offerAcceptanceRate = offered > 0 ? Math.round((hired / offered) * 100) : 80; // default benchmark fallback

  // 3. Funnel Stages (Applied -> Screening -> Interviewing -> Offered -> Hired)
  const funnelStages = [
    { label: 'Applied', count: totalApps, color: 'bg-slate-500' },
    { label: 'Screening', count: screening + scheduled + offered + hired, color: 'bg-amber-500' },
    { label: 'Interviewing', count: scheduled + offered + hired, color: 'bg-rose-500' },
    { label: 'Offered', count: offered + hired, color: 'bg-emerald-500' },
    { label: 'Hired', count: hired, color: 'bg-emerald-600' }
  ];

  const maxFunnelCount = Math.max(...funnelStages.map(s => s.count), 1);

  return (
    <div className="flex flex-col gap-4 max-w-7xl relative">
      {/* Header */}
      <div className="border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Analytics</h1>
        <p className="text-[11px] text-[#666]">Overview of pipeline conversion metrics and active job posting loads</p>
      </div>

      {error && <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: Key Conversions */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-4">
            <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-amber-500" />
              <span>Conversion Rates</span>
            </h2>

            <div className="flex flex-col gap-4">
              {/* Interview conversion */}
              <div className="bg-[#121212] border border-[#2e2e2e] p-3 rounded flex flex-col gap-1 border-l-2 border-l-rose-500">
                <span className="text-[9px] font-mono text-[#888] uppercase">Interview Conversion Rate</span>
                <span className="text-2xl font-bold text-white font-mono mt-1">{interviewConversionRate}%</span>
                <span className="text-[9px] text-[#666] leading-snug mt-1">Percentage of applicants scheduled for loops. Benchmark is 15-20%.</span>
              </div>

              {/* Offer acceptance */}
              <div className="bg-[#121212] border border-[#2e2e2e] p-3 rounded flex flex-col gap-1 border-l-2 border-l-emerald-500">
                <span className="text-[9px] font-mono text-[#888] uppercase">Offer Acceptance Rate</span>
                <span className="text-2xl font-bold text-white font-mono mt-1">{offerAcceptanceRate}%</span>
                <span className="text-[9px] text-[#666] leading-snug mt-1">Percentage of candidates accepting offers. Benchmark is 75-80%.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Hiring Funnel Chart */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-3">
          <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1.5 mb-2 flex items-center gap-1.5">
            <BarChart3 size={13} className="text-amber-500" />
            <span>Hiring Funnel</span>
          </h2>

          <div className="flex flex-col gap-3.5 mt-2">
            {funnelStages.map((stage, idx) => {
              const widthPct = Math.round((stage.count / maxFunnelCount) * 100);
              return (
                <div key={idx} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-baseline text-[11px]">
                    <span className="text-[#a1a1aa] font-medium">{stage.label}</span>
                    <span className="font-mono text-[#888]">{stage.count} candidates</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#121212] border border-[#2e2e2e] rounded-sm overflow-hidden">
                    <div className={`h-full ${stage.color} transition-all duration-300`} style={{ width: `${widthPct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Applications per Job */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-3">
          <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1.5 mb-2 flex items-center gap-1.5">
            <Briefcase size={13} className="text-amber-500" />
            <span>Applications per Job</span>
          </h2>

          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {appPerJob.length > 0 ? (
              appPerJob.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-[#141414] border border-[#2a2a2a] rounded flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate max-w-[140px]">{item.title}</span>
                  <span className="bg-[#242424] border border-[#2a2a2a] text-[#a1a1aa] font-mono text-[10px] px-2 py-0.5 rounded">
                    {item.count} applicants
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[#555] italic font-mono">No jobs posted.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
