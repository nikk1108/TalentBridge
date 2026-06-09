import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Phone, MapPin, User, ChevronRight, Inbox, ExternalLink } from 'lucide-react';
import api from '../services/api';

const InterviewCenter = () => {
  const user = api.getCurrentUser();
  const isRecruiter = user?.role === 'recruiter';

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInterviews = async () => {
    try {
      const data = await api.getCandidates();
      // Filter candidates that have interviewDate scheduled
      const filtered = data.filter(c => c.interviewDate);
      // Sort: upcoming first, then past
      const sorted = filtered.sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
      setInterviews(sorted);
    } catch (err) {
      setError(err.message || 'Failed to retrieve scheduled interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const getInterviewIcon = (type) => {
    switch (type) {
      case 'Online':
        return <Video size={13} className="text-emerald-400" />;
      case 'Phone':
        return <Phone size={13} className="text-amber-500" />;
      default:
        return <MapPin size={13} className="text-[#a1a1aa]" />;
    }
  };

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Past';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const upcomingInterviews = interviews.filter(i => new Date(i.interviewDate) >= new Date());
  const pastInterviews = interviews.filter(i => new Date(i.interviewDate) < new Date());

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Loading interviews calendar...</div>;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
        Error: {error}
      </div>
    );
  }

  const renderInterviewCard = (item) => {
    const date = new Date(item.interviewDate);
    const countdown = getCountdown(item.interviewDate);

    return (
      <div key={item._id} className="bg-[#1b1b1b] border border-[#2a2a2a] rounded p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all border-l-2 border-l-amber-500">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider font-semibold">
              {item.interviewType || 'Online'} Interview
            </span>
            {countdown !== 'Past' && (
              <span className="bg-amber-600/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                {countdown}
              </span>
            )}
          </div>

          <h3 className="text-xs font-bold text-white mb-0.5">{item.job?.title || 'Job Opening'}</h3>
          <p className="text-[10px] text-[#888] font-mono mb-3">{item.job?.companyName || 'Acme Corp'}</p>

          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-[#2e2e2e]/40 text-[11px] text-[#a1a1aa] font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-[#555]" />
              <span>{date.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-[#555]" />
              <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User size={11} className="text-[#555]" />
              <span>
                {isRecruiter ? `Candidate: ${item.name}` : `Interviewer: ${item.interviewerName || 'Recruiter'}`}
              </span>
            </div>
            {item.meetingLink && (
              <div className="flex items-center gap-1.5">
                {getInterviewIcon(item.interviewType)}
                <a
                  href={item.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-500 hover:underline flex items-center gap-0.5"
                >
                  <span>Join Meeting</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>

          {item.interviewNotes && (
            <div className="mt-3 p-2 bg-[#141414] border border-[#2e2e2e]/60 rounded text-[10px] text-[#666] leading-relaxed italic">
              Notes: {item.interviewNotes}
            </div>
          )}
        </div>

        {isRecruiter && (
          <div className="mt-4 pt-2 border-t border-[#2e2e2e]/30 flex justify-between items-center">
            <span className="text-[10px] text-[#888] font-mono">Status: <span className="text-white font-semibold">{item.status}</span></span>
            <Link
              to={`/candidates/${item._id}`}
              className="text-[10px] text-amber-500 hover:underline flex items-center"
            >
              <span>Review Candidate</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl relative">
      <div className="border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">
          {isRecruiter ? 'Interview Management' : 'Interview Center'}
        </h1>
        <p className="text-[11px] text-[#666]">
          {isRecruiter ? 'Review upcoming recruiter loops and feedback queues' : 'Manage your upcoming recruiter loops and join meetings'}
        </p>
      </div>

      {interviews.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-[#2a2a2a] rounded bg-[#161616] max-w-xl mx-auto my-6 w-full">
          <Calendar size={24} className="text-[#444] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-white mb-1">No interviews scheduled</h3>
          <p className="text-[10px] text-[#666]">
            {isRecruiter ? 'No candidates have been scheduled for loops yet.' : 'You have no scheduled interview loops yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* UPCOMING */}
          {upcomingInterviews.length > 0 && (
            <div>
              <h2 className="text-xs font-mono text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-[#2a2a2a] pb-1.5">
                <span>Upcoming Interviews ({upcomingInterviews.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingInterviews.map(renderInterviewCard)}
              </div>
            </div>
          )}

          {/* PAST */}
          {pastInterviews.length > 0 && (
            <div>
              <h2 className="text-xs font-mono text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-[#2a2a2a] pb-1.5">
                <span className="text-[#666]">Past Interviews ({pastInterviews.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
                {pastInterviews.map(renderInterviewCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewCenter;
