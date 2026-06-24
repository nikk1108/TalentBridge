import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Building2, 
  Calendar, 
  DollarSign, 
  Users, 
  Edit, 
  Trash2, 
  Bookmark, 
  CheckCircle2, 
  Upload, 
  Sparkles,
  Link2,
  Award
} from 'lucide-react';
import api, { API_URL } from '../services/api';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = api.getCurrentUser();
  const isRecruiter = user?.role === 'recruiter';

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationDetails, setApplicationDetails] = useState(null);

  // Application Modal state
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [candSkills, setCandSkills] = useState('');
  const [candNotes, setCandNotes] = useState('');
  const [candResumeFile, setCandResumeFile] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  // Candidate Match Score Preview state (based on profile skills)
  const [profileMatchScore, setProfileMatchScore] = useState(null);

  // AI Interview Questions state
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  const handleGenerateQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const data = await api.generateInterviewQuestions(id);
      setGeneratedQuestions(data);
    } catch (err) {
      alert(err.message || 'Failed to generate AI interview questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const data = await api.getJob(id);
      setJob(data);

      if (!isRecruiter) {
        // Fetch saved status and application status
        const currentUserData = await api.getNotifications(); // notifications query returns user profile details or we can use /me
        // Let's retrieve user profile details using GET /me
        const me = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
        
        const savedIds = me.savedJobs?.map(j => String(j._id || j)) || [];
        setIsSaved(savedIds.includes(String(id)));

        // Check if already applied
        const apps = await api.getCandidates();
        const existingApp = apps.find(app => String(app.jobId?._id || app.jobId) === String(id));
        if (existingApp) {
          setApplied(true);
          setApplicationDetails(existingApp);
        } else {
          // Calculate profile match score preview if candidate has profile skills
          const profileSkills = me.profile?.skills || [];
          if (profileSkills.length > 0 && data.skills?.length > 0) {
            // Send test calculation
            const normalize = str => str.toLowerCase().replace(/[^a-z0-9#+]/g, '').trim();
            const normalizedCand = profileSkills.map(normalize);
            const matched = data.skills.filter(s => normalizedCand.includes(normalize(s)));
            const score = Math.round((matched.length / data.skills.length) * 100);
            setProfileMatchScore(score);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve job specifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleDelete = async () => {
    const confirm = window.confirm('Are you sure you want to delete this job opening? All candidate records will be lost permanently.');
    if (!confirm) return;

    try {
      await api.deleteJob(id);
      navigate('/jobs');
    } catch (err) {
      alert(err.message || 'Failed to delete job listing');
    }
  };

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        await api.unsaveJob(id);
        setIsSaved(false);
      } else {
        await api.saveJob(id);
        setIsSaved(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to save job bookmark');
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!candResumeFile) {
      return setApplyError('Please upload a PDF resume file to apply.');
    }

    setApplyLoading(true);
    setApplyError('');
    setApplySuccess('');

    try {
      // 1. Upload PDF resume
      const uploadRes = await api.uploadResume(candResumeFile);
      const resumePath = uploadRes.filePath;

      // 2. Submit application
      const newApp = await api.createCandidate({
        jobId: id,
        skills: candSkills,
        resumePath: resumePath,
        notes: candNotes
      });

      setApplySuccess('Application submitted successfully!');
      setApplied(true);
      setApplicationDetails(newApp);
      
      setTimeout(() => {
        setIsApplyOpen(false);
        setApplySuccess('');
        setCandSkills('');
        setCandNotes('');
        setCandResumeFile(null);
      }, 1500);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Loading job dossier...</div>;
  }

  if (error || !job) {
    return (
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
        Error: {error || 'Job not found'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl relative">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/jobs" className="p-1 hover:bg-[#1a1a1a] rounded text-[#888] hover:text-white transition-colors">
            <ArrowLeft size={14} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white">{job.title}</h1>
            <p className="text-[11px] text-[#a1a1aa] font-medium mt-0.5">
              {job.companyName || 'Company Not Specified'}
              {job.department && <span className="text-[#666] font-normal"> – {job.department}</span>}
            </p>
          </div>
        </div>
        
        {/* Recruiter controls */}
        {isRecruiter ? (
          <div className="flex items-center gap-2">
            <Link
              to={`/jobs/edit/${job._id}`}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#222] border border-[#2e2e2e] hover:bg-[#2a2a2a] text-[#e4e4e7] rounded text-xs font-medium transition-colors"
            >
              <Edit size={13} />
              <span>Edit Job</span>
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-950/10 border border-red-500/20 hover:bg-red-900/20 text-red-400 rounded text-xs font-medium transition-colors"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
            <Link
              to={`/candidates?jobId=${job._id}`}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
            >
              <Users size={13} />
              <span>View Applicants</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`flex items-center gap-1.5 px-3 py-1 border rounded text-xs font-medium transition-colors ${
                isSaved
                  ? 'bg-amber-600/10 border-amber-500/40 text-amber-500'
                  : 'bg-[#222] border-[#2e2e2e] text-[#a1a1aa] hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <Bookmark size={13} className={isSaved ? 'fill-current' : ''} />
              <span>{isSaved ? 'Saved' : 'Save Job'}</span>
            </button>
            {applied ? (
              <span className="px-3 py-1 bg-[#222] border border-[#2e2e2e] text-[#666] text-xs font-medium rounded cursor-not-allowed select-none">
                Already Applied
              </span>
            ) : (
              <button
                onClick={() => setIsApplyOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
              >
                <span>Apply Now</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* CORE SPECIFICATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Side: Spec Card */}
        <div className="bg-[#1a1a1a] border-l-2 border-l-amber-500 border-[#2a2a2a] rounded-r p-4 flex flex-col gap-4">
          <div>
            <span className="text-[9px] font-mono text-[#666] uppercase">Company Info</span>
            <div className="flex items-center gap-2.5 mt-1">
              {job.companyLogoUrl ? (
                <img src={job.companyLogoUrl} alt="Logo" className="w-8 h-8 rounded border border-[#2e2e2e] object-cover bg-white" />
              ) : (
                <div className="w-8 h-8 rounded border border-[#2e2e2e] bg-[#222] flex items-center justify-center text-xs text-amber-500 font-bold">🏢</div>
              )}
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">{job.companyName}</h3>
                {job.companyWebsite && (
                  <a href={job.companyWebsite} target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 hover:underline flex items-center gap-0.5 mt-0.5">
                    <Link2 size={10} />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#2e2e2e]/50 pt-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <Building2 size={13} className="text-[#666]" />
              <span>{job.companyName || 'Company Not Specified'}</span>
            </div>
            {job.department && (
              <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                <Briefcase size={13} className="text-[#666]" />
                <span>{job.department}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <MapPin size={13} className="text-[#666]" />
              <span>{job.location} ({job.workplace})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <Award size={13} className="text-[#666]" />
              <span>{job.experienceLevel || 'Mid-Level'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <DollarSign size={13} className="text-[#666]" />
              <span>{job.salaryRange || 'Competitive Salary'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <Calendar size={13} className="text-[#666]" />
              <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <Users size={13} className="text-[#666]" />
              <span>{job.applicantCount || 0} Applicants</span>
            </div>
          </div>

          {/* Candidates match score card */}
          {!isRecruiter && (
            <div className="border-t border-[#2e2e2e]/50 pt-3 mt-1">
              <span className="text-[9px] font-mono text-[#666] uppercase block mb-1">AI Match Summary</span>
              {applied ? (
                <div className="bg-[#222] border border-[#2a2a2a] rounded p-2.5 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#888] font-mono">My Score:</span>
                    <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                      applicationDetails?.matchStatus === 'Excellent Match'
                        ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20'
                        : applicationDetails?.matchStatus === 'Good Match'
                        ? 'bg-amber-950/20 text-amber-400 border border-amber-500/20'
                        : 'bg-[#2a2a2a] text-[#888] border border-[#3c3c3c]'
                    }`}>
                      {applicationDetails?.matchScore}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[#a1a1aa] font-medium mt-1">{applicationDetails?.matchStatus}</span>
                </div>
              ) : profileMatchScore !== null ? (
                <div className="bg-[#222] border border-[#2a2a2a] rounded p-2.5 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#888] font-mono">Profile Match:</span>
                    <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                      profileMatchScore >= 80 ? 'text-emerald-400' : profileMatchScore >= 50 ? 'text-amber-400' : 'text-[#888]'
                    }`}>
                      {profileMatchScore}%
                    </span>
                  </div>
                  <span className="text-[9px] text-[#666] leading-snug mt-1">Score calculated based on matching your profile skills.</span>
                </div>
              ) : (
                <div className="text-[10px] text-[#555] italic font-mono p-2 bg-[#161616] border border-[#2e2e2e] rounded">
                  No skills match preview. Set up skills in profile to see.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Full specification details */}
        <div className="md:col-span-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-5">
          {/* Job description section */}
          <div>
            <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1.5 mb-3">Role Overview</h2>
            <div className="text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap font-sans">
              {job.description}
            </div>
          </div>

          {/* Requirements list */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1.5 mb-3">Requirements</h2>
              <ul className="list-disc pl-4 flex flex-col gap-1.5 text-xs text-[#a1a1aa]">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="leading-relaxed">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills checklist */}
          {job.skills && job.skills.length > 0 && (
            <div>
              <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1.5 mb-2.5">Key Skills Required</h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill, idx) => (
                  <span key={idx} className="bg-[#242424] border border-[#2e2e2e] text-[#a1a1aa] text-[10px] px-2 py-0.5 rounded font-mono">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Interview Questions (Recruiter Only) */}
          {isRecruiter && (
            <div className="border-t border-[#2e2e2e]/30 pt-5 mt-2 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xs font-mono text-white uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>AI Interview Guide Generator</span>
                  </h2>
                  <p className="text-[10px] text-[#666] mt-0.5">Generate technical and behavioral candidate evaluation queries</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={questionsLoading}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-[#222] disabled:border-[#2e2e2e] disabled:text-[#666] text-white rounded text-[10px] font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Sparkles size={11} className={questionsLoading ? 'animate-spin' : ''} />
                  <span>{questionsLoading ? 'Generating Guide...' : 'Generate Interview Questions'}</span>
                </button>
              </div>

              {generatedQuestions ? (
                <div className="flex flex-col gap-4 bg-[#121212] border border-[#2e2e2e] rounded p-4 font-sans animate-in fade-in duration-200">
                  {/* Technical Questions */}
                  <div>
                    <h3 className="text-[11px] font-mono text-amber-500 uppercase tracking-wider mb-2.5 font-bold border-b border-[#2e2e2e]/40 pb-1">
                      Technical Questions ({generatedQuestions.technical?.length || 0})
                    </h3>
                    <ul className="list-decimal pl-4 flex flex-col gap-2.5 text-[11px] text-[#a1a1aa]">
                      {generatedQuestions.technical?.map((q, idx) => (
                        <li key={idx} className="leading-relaxed pl-1">
                          <span className="text-[#e4e4e7]">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* HR/General Questions */}
                  <div className="border-t border-[#2e2e2e]/30 pt-4 mt-2">
                    <h3 className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-2.5 font-bold border-b border-[#2e2e2e]/40 pb-1">
                      Behavioral & HR Questions ({generatedQuestions.hr?.length || 0})
                    </h3>
                    <ul className="list-decimal pl-4 flex flex-col gap-2.5 text-[11px] text-[#a1a1aa]">
                      {generatedQuestions.hr?.map((q, idx) => (
                        <li key={idx} className="leading-relaxed pl-1">
                          <span className="text-[#e4e4e7]">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-[#555] font-mono italic p-3 bg-[#121212] border border-[#2e2e2e]/40 border-dashed rounded text-center">
                  No interview questions generated yet. Click "Generate Interview Questions" to build the evaluation guide.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL APPLICATION DRAWER */}
      {isApplyOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 flex flex-col justify-between shadow-2xl animate-in fade-in duration-200">
            <div>
              <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-2.5 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Submit Application: {job.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApplyOpen(false)}
                  className="text-xs text-[#888] hover:text-white px-2 py-0.5 rounded hover:bg-[#222]"
                >
                  ✕
                </button>
              </div>

              {applyError && (
                <div className="mb-4 p-2 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
                  Error: {applyError}
                </div>
              )}

              {applySuccess && (
                <div className="mb-4 p-2 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>{applySuccess}</span>
                </div>
              )}

              <form id="apply-details-form" onSubmit={handleApplySubmit} className="flex flex-col gap-4">
                
                {/* Skills input */}
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
                  <div className="relative border border-dashed border-[#2a2a2a] bg-[#121212] rounded p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[#161616] transition-colors group">
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

                {/* Cover Note */}
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
                onClick={() => setIsApplyOpen(false)}
                className="px-3 py-1.5 bg-transparent border border-[#2e2e2e] hover:bg-[#222] text-xs font-medium rounded text-[#a1a1aa] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="apply-details-form"
                disabled={applyLoading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
              >
                {applyLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
