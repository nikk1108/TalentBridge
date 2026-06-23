import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileText, CheckCircle2, AlertTriangle, Plus, Trash2, 
  Edit, Calendar, Clock, Save, History, Sparkles, 
  Linkedin, Github, Globe, Briefcase, GraduationCap, Award, Star
} from 'lucide-react';
import api, { API_URL } from '../services/api';

const CandidateProfile = () => {
  const { id } = useParams();

  const getResumeUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
  };

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status state
  const [status, setStatus] = useState('Applied');

  // Interview state
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewType, setInterviewType] = useState('Online');
  const [interviewerName, setInterviewerName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [savingInterview, setSavingInterview] = useState(false);

  // Recruiter notes/comments state
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(5);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentRating, setEditingCommentRating] = useState(5);
  const [savingComment, setSavingComment] = useState(false);

  // Skills state
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [skillText, setSkillText] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  const fetchCandidate = async () => {
    try {
      const data = await api.getCandidate(id);
      setCandidate(data);
      setStatus(data.status || 'Applied');
      setComments(data.comments || []);
      setSkillText(data.skills?.join(', ') || '');
      setInterviewType(data.interviewType || 'Online');
      setInterviewerName(data.interviewerName || '');
      setMeetingLink(data.meetingLink || '');
      
      // Formatting date for datetime-local input
      if (data.interviewDate) {
        const d = new Date(data.interviewDate);
        if (!isNaN(d.getTime())) {
          const pad = n => String(n).padStart(2, '0');
          const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setInterviewDate(formatted);
        } else {
          setInterviewDate('');
        }
      } else {
        setInterviewDate('');
      }
      setInterviewNotes(data.interviewNotes || '');
    } catch (err) {
      setError(err.message || 'Failed to retrieve candidate profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.updateCandidate(id, { status: newStatus });
      setCandidate(updated);
      setStatus(updated.status);
      alert(`Candidate status updated to: ${newStatus}`);
    } catch (err) {
      alert(err.message || 'Failed to update candidate status');
    }
  };

  const handleSaveInterview = async () => {
    setSavingInterview(true);
    try {
      const updated = await api.updateCandidate(id, {
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        interviewNotes,
        interviewType,
        interviewerName,
        meetingLink
      });
      setCandidate(updated);
      alert('Interview details saved.');
    } catch (err) {
      alert(err.message || 'Failed to save interview details');
    } finally {
      setSavingInterview(false);
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const updated = await api.updateCandidate(id, { skills: skillText });
      setCandidate(updated);
      setIsEditingSkills(false);
      alert('Skills and match score re-evaluated.');
    } catch (err) {
      alert(err.message || 'Failed to save candidate skills');
    } finally {
      setSavingSkills(false);
    }
  };

  // Comments Operations
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSavingComment(true);
    try {
      const comment = await api.addComment(id, newCommentText, newCommentRating);
      setComments([...comments, comment]);
      setNewCommentText('');
      setNewCommentRating(5);
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSavingComment(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const updatedComment = await api.updateComment(id, commentId, editingCommentText, editingCommentRating);
      setComments(comments.map(c => c._id === commentId ? updatedComment : c));
      setEditingCommentId(null);
      setEditingCommentText('');
      setEditingCommentRating(5);
    } catch (err) {
      alert(err.message || 'Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirm = window.confirm('Are you sure you want to delete this comment?');
    if (!confirm) return;

    try {
      await api.deleteComment(id, commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to remove comment');
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Loading candidate dossier...</div>;
  }

  if (error || !candidate) {
    return (
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
        Error loading profile: {error || 'Profile not found'}
      </div>
    );
  }

  // Calculate skills intersection
  const jobSkills = candidate.job?.skills || [];
  const candidateSkills = candidate.skills || [];
  const normalize = str => str.toLowerCase().replace(/[^a-z0-9#+]/g, '').trim();
  const normalizedCandidate = candidateSkills.map(normalize);

  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach(skill => {
    const norm = normalize(skill);
    if (normalizedCandidate.includes(norm)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const badgeColor =
    candidate.matchStatus === 'Excellent Match'
      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
      : candidate.matchStatus === 'Good Match'
      ? 'bg-amber-950/20 border-amber-500/20 text-amber-400'
      : 'bg-[#2a2a2a] border-[#3c3c3c] text-[#888]';

  // Gather details from populated candidateId
  const candProfile = candidate.candidateId?.profile || {};
  const education = candProfile.education || [];
  const experience = candProfile.experience || [];
  const certifications = candProfile.certifications || [];
  const githubUrl = candProfile.githubUrl || '';
  const linkedinUrl = candProfile.linkedinUrl || '';
  const portfolioUrl = candProfile.portfolioUrl || '';
  const photoUrl = candProfile.photo || '';
  const resumeLink = candidate.resumePath || candProfile.resumePath || candidate.resumeUrl || candProfile.resumeUrl || '';

  return (
    <div className="flex flex-col gap-4 max-w-6xl pb-10">
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-[#2e2e2e]/50 pb-3">
        <Link to="/candidates" className="p-1 hover:bg-[#1a1a1a] rounded text-[#888] hover:text-white transition-colors">
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-white">Review Profile: {candidate.name}</h1>
          <p className="text-[11px] text-[#666]">Detailed dossier evaluation and job requirements alignment</p>
        </div>
      </div>

      {/* UPPER PANEL - BIO AND MATCH RATIO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Dossier Card */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-emerald-500 rounded p-4 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {photoUrl ? (
                <img src={photoUrl} alt={candidate.name} className="w-12 h-12 rounded-full object-cover border border-[#2e2e2e]" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#242424] flex items-center justify-center text-xs font-bold text-white border border-[#2e2e2e]">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div>
                <span className="text-[9px] font-mono text-[#666] uppercase">Candidate Details</span>
                <h2 className="text-sm font-bold text-white mt-0.5">{candidate.name}</h2>
                <p className="text-xs text-[#a1a1aa] font-mono">{candidate.email}</p>
              </div>
            </div>

            <div className="border-t border-[#2e2e2e]/50 pt-2.5">
              <span className="text-[9px] font-mono text-[#666] uppercase">Applied Position</span>
              <p className="text-xs font-semibold text-white mt-1">
                {candidate.job?.title || 'Unknown Role'}
              </p>
              <p className="text-[10px] text-[#888]">
                Department: {candidate.job?.department || 'N/A'}
              </p>
            </div>

            <div className="border-t border-[#2e2e2e]/50 pt-2.5">
              <span className="text-[9px] font-mono text-[#666] uppercase">Social & Portfolio Links</span>
              <div className="flex gap-2 mt-2">
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-[#222] hover:bg-[#2a2a2a] border border-[#2e2e2e] rounded text-slate-400 hover:text-white transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin size={12} />
                  </a>
                )}
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-[#222] hover:bg-[#2a2a2a] border border-[#2e2e2e] rounded text-slate-400 hover:text-white transition-colors"
                    title="GitHub"
                  >
                    <Github size={12} />
                  </a>
                )}
                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-[#222] hover:bg-[#2a2a2a] border border-[#2e2e2e] rounded text-slate-400 hover:text-white transition-colors"
                    title="Portfolio"
                  >
                    <Globe size={12} />
                  </a>
                )}
                {!linkedinUrl && !githubUrl && !portfolioUrl && (
                  <span className="text-[10px] text-[#555] font-mono italic">No external links provided</span>
                )}
              </div>
            </div>

            <div className="border-t border-[#2e2e2e]/50 pt-2.5">
              <span className="text-[9px] font-mono text-[#666] uppercase">Resume / Document Link</span>
              {candidate.resumePath ? (
                <a
                  href={getResumeUrl(candidate.resumePath)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-[#2a2a2a] text-xs font-medium rounded text-amber-500 hover:text-amber-400 transition-colors w-max"
                >
                  <FileText size={12} />
                  <span>Download PDF Resume</span>
                </a>
              ) : candidate.resumeUrl ? (
                <a
                  href={getResumeUrl(candidate.resumeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-[#2a2a2a] text-xs font-medium rounded text-amber-500 hover:text-amber-400 transition-colors w-max"
                >
                  <FileText size={12} />
                  <span>Open Resume URL</span>
                </a>
              ) : (
                <p className="text-xs text-[#555] mt-1 font-mono italic">No resume provided</p>
              )}
            </div>
          </div>

          {/* Workflow Status Dropdown */}
          <div className="border-t border-[#2e2e2e]/50 pt-3 mt-4">
            <span className="text-[9px] font-mono text-[#666] uppercase block mb-1.5">Application Workflow Status</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500/60 font-sans"
            >
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offered">Offered</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* AI Analysis and Skill Mapping */}
        <div className="md:col-span-2 bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-amber-500 rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-2 mb-3">
              <span className="text-[10px] font-mono text-white uppercase tracking-wider">⚡ TalentBridge Match Status</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${badgeColor}`}>
                {candidate.matchStatus}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-white">{candidate.matchScore}%</span>
              <span className="text-xs text-[#888]">overall criteria coverage</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matched skills */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  <span>Matched Skills ({matchedSkills.length})</span>
                </span>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchedSkills.map((s, idx) => (
                      <span key={idx} className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#555] font-mono italic">No matches identified.</p>
                )}
              </div>

              {/* Missing skills */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={10} />
                  <span>Missing Skills ({missingSkills.length})</span>
                </span>
                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {missingSkills.map((s, idx) => (
                      <span key={idx} className="bg-[#242424] border border-[#2e2e2e] text-[#888] text-[10px] px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-400 font-mono font-medium">All role skills satisfied!</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-[#141414] border border-[#2e2e2e] rounded text-[10px] text-[#666] leading-relaxed">
            The AI Match score intersections Candidate Skills list against Job requirements. Recruiters can add skills found during reviews to recalculate.
          </div>
        </div>

      </div>

      {/* NEW SECTION - DETAILED PUBLIC PROFILE DOSSIER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Profile details & lists */}
        <div className="md:col-span-2 bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-slate-500 rounded p-4 flex flex-col gap-4">
          <div className="text-xs text-white font-medium border-b border-[#2e2e2e]/50 pb-2 flex items-center gap-1.5">
            <Briefcase size={13} className="text-[#888]" />
            <span>Candidate Professional Dossier</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Experience */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-white uppercase tracking-wider flex items-center gap-1">
                <Briefcase size={10} className="text-amber-500" />
                <span>Work Experience</span>
              </span>
              {experience.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {experience.map((exp, idx) => (
                    <div key={idx} className="p-2.5 bg-[#141414] border border-[#2e2e2e] rounded text-xs">
                      <h4 className="font-bold text-white">{exp.role}</h4>
                      <p className="text-[#888] text-[10px] font-mono mt-0.5">{exp.company} ({exp.years})</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[#555] font-mono italic">No experience declared.</p>
              )}
            </div>

            {/* Education */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-white uppercase tracking-wider flex items-center gap-1">
                <GraduationCap size={10} className="text-emerald-400" />
                <span>Education</span>
              </span>
              {education.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {education.map((edu, idx) => (
                    <div key={idx} className="p-2.5 bg-[#141414] border border-[#2e2e2e] rounded text-xs">
                      <h4 className="font-bold text-white">{edu.degree}</h4>
                      <p className="text-[#888] text-[10px] font-mono mt-0.5">{edu.school} ({edu.year})</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[#555] font-mono italic">No education declared.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2e2e2e]/30 pt-3">
            {/* Certifications */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-white uppercase tracking-wider flex items-center gap-1">
                <Award size={10} className="text-purple-400" />
                <span>Certifications</span>
              </span>
              {certifications.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {certifications.map((cert, idx) => (
                    <span key={idx} className="bg-[#242424] border border-[#2e2e2e] text-[#a1a1aa] text-[10px] px-2 py-0.5 rounded">
                      {cert}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[#555] font-mono italic">No certifications declared.</p>
              )}
            </div>

            {/* Soft Skills */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-white uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} className="text-blue-400" />
                <span>Soft Skills</span>
              </span>
              {candProfile.softSkills && candProfile.softSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {candProfile.softSkills.map((ss, idx) => (
                    <span key={idx} className="bg-[#242424] border border-[#2e2e2e] text-[#a1a1aa] text-[10px] px-2 py-0.5 rounded">
                      {ss}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[#555] font-mono italic">No soft skills declared.</p>
              )}
            </div>
          </div>
        </div>

        {/* Resume Preview */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-slate-400 rounded p-4 flex flex-col gap-3">
          <div className="text-xs text-white font-medium border-b border-[#2e2e2e]/50 pb-2 flex justify-between items-center">
            <span className="flex items-center gap-1.5"><FileText size={13} className="text-amber-500" />Resume Preview</span>
            {resumeLink && (
              <a href={getResumeUrl(resumeLink)} target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 hover:underline">
                New Tab
              </a>
            )}
          </div>
          {resumeLink ? (
            <iframe
              src={getResumeUrl(resumeLink)}
              title="Resume Preview"
              className="w-full h-60 border border-[#2e2e2e] rounded bg-[#121212]"
            />
          ) : (
            <div className="text-center text-[#555] text-[10px] py-16 font-mono italic">
              No document uploaded to preview
            </div>
          )}
        </div>

      </div>

      {/* MIDDLE PANEL - TIMELINE HISTORY & SCHEDULES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Timeline tracker */}
        <div className="md:col-span-2 bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-slate-400 rounded p-4">
          <div className="flex items-center gap-1.5 text-xs text-white font-medium border-b border-[#2e2e2e]/50 pb-2 mb-3">
            <History size={13} className="text-[#888]" />
            <span>Application Timeline Tracker</span>
          </div>

          <div className="flex flex-col gap-3 mt-4 ml-2 pl-4 border-l border-[#2e2e2e]">
            {candidate.statusHistory?.map((hist, idx) => (
              <div key={idx} className="relative flex flex-col gap-0.5">
                {/* Visual marker dot */}
                <span className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#121212] bg-amber-500"></span>
                <span className="text-xs font-semibold text-white">{hist.status}</span>
                <span className="text-[9px] text-[#555] font-mono">
                  {new Date(hist.updatedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interview scheduler panel */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-amber-500 rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white font-medium border-b border-[#2e2e2e]/50 pb-2 mb-3">
              <Calendar size={13} className="text-amber-500" />
              <span>Interview Schedule</span>
            </div>

            {status === 'Interview Scheduled' || status === 'Interviewing' ? (
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[#888] font-mono uppercase">Interview Date & Time</label>
                  <input
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="bg-[#121212] border border-[#2e2e2e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[#888] font-mono uppercase">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="bg-[#121212] border border-[#2e2e2e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 font-sans"
                  >
                    <option value="Online">Online</option>
                    <option value="Phone">Phone</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[#888] font-mono uppercase">Interviewer Name</label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="Interviewer Name"
                    className="bg-[#121212] border border-[#2e2e2e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[#888] font-mono uppercase">Meeting Link / Location</label>
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="Zoom Link, Phone #, or Office Room..."
                    className="bg-[#121212] border border-[#2e2e2e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[#888] font-mono uppercase">Schedule / Location Notes</label>
                  <textarea
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    rows={2}
                    placeholder="Zoom passcode or instructions..."
                    className="bg-[#121212] border border-[#2e2e2e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 font-sans"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-[#555] text-[10px] py-10 font-mono leading-relaxed">
                Advance candidate status to "Interview Scheduled" or "Interviewing" to enable scheduling calendar details.
              </div>
            )}
          </div>

          {(status === 'Interview Scheduled' || status === 'Interviewing') && (
            <button
              onClick={handleSaveInterview}
              disabled={savingInterview}
              className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 hover:text-amber-500 text-xs font-semibold rounded text-white transition-all w-full"
            >
              <Save size={12} />
              <span>{savingInterview ? 'Saving...' : 'Save Interview Details'}</span>
            </button>
          )}
        </div>

      </div>

      {/* LOWER PANEL - RECRUITER COMMENTS MANAGER & SKILLS EDITING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Comments Feed Thread */}
        <div className="md:col-span-2 bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-amber-600 rounded p-4">
          <div className="text-xs text-white font-medium border-b border-[#2e2e2e]/50 pb-2 mb-3">
            Recruiter Assessment Comments (Private)
          </div>

          {/* List Comments */}
          <div className="flex flex-col gap-2.5 mb-4 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-[10px] text-[#555] font-mono py-2">No private evaluation notes recorded.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="p-2.5 bg-[#141414] border border-[#2e2e2e] rounded flex flex-col gap-1.5">
                  {editingCommentId === comment._id ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-[#888] font-mono uppercase">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditingCommentRating(star)}
                            className={`text-sm hover:scale-110 transition-transform ${star <= editingCommentRating ? 'text-amber-500' : 'text-[#444]'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={2}
                        className="w-full bg-[#121212] border border-[#2e2e2e] rounded p-1.5 text-xs text-white focus:outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                            setEditingCommentRating(5);
                          }}
                          className="px-2 py-0.5 text-[9px] bg-transparent border border-[#2e2e2e] hover:bg-[#222] text-[#888] rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditComment(comment._id)}
                          className="px-2 py-0.5 text-[9px] bg-amber-600 text-white rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between h-full">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`text-xs ${star <= (comment.rating || 5) ? 'text-amber-500' : 'text-[#444]'}`}>★</span>
                        ))}
                      </div>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                      <div className="flex justify-between items-center border-t border-[#2e2e2e]/30 pt-1.5 mt-1.5 text-[8px] font-mono text-[#555]">
                        <span>Posted on: {new Date(comment.createdAt).toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCommentId(comment._id);
                              setEditingCommentText(comment.text);
                              setEditingCommentRating(comment.rating || 5);
                            }}
                            className="hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#888] uppercase font-mono">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewCommentRating(star)}
                  className={`text-sm hover:scale-110 transition-transform ${star <= newCommentRating ? 'text-amber-500' : 'text-[#444]'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add assessment or interview summary notes..."
                className="flex-1 bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
              />
              <button
                type="submit"
                disabled={savingComment}
                className="flex items-center justify-center p-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 hover:text-amber-500 text-xs font-semibold rounded text-white transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
          </form>
        </div>

        {/* Skills Directory Manager */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] border-l-4 border-l-slate-500 rounded p-4 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-2">
              <span className="text-[10px] font-mono text-white uppercase tracking-wider font-semibold">Verified Skills</span>
              {!isEditingSkills ? (
                <button
                  onClick={() => setIsEditingSkills(true)}
                  className="flex items-center gap-1 text-[10px] font-medium text-amber-500 hover:text-amber-400"
                >
                  <Edit size={10} />
                  <span>Update</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveSkills}
                  disabled={savingSkills}
                  className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:text-emerald-300"
                >
                  <CheckCircle2 size={10} />
                  <span>{savingSkills ? 'Saving...' : 'Confirm'}</span>
                </button>
              )}
            </div>

            {isEditingSkills ? (
              <textarea
                value={skillText}
                onChange={(e) => setSkillText(e.target.value)}
                rows={5}
                placeholder="React, TypeScript, CSS3"
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
              />
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {candidateSkills.map((s, idx) => (
                  <span key={idx} className="bg-[#242424] border border-[#2e2e2e] text-[#a1a1aa] text-[10px] px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-[9px] text-[#666] leading-snug pt-3 border-t border-[#2e2e2e]/50 mt-4">
            Recruiter verification: Confirm candidate skills during initial screen and write them above. Match scores will instantly recompute.
          </div>
        </div>

      </div>

    </div>
  );
};

export default CandidateProfile;
