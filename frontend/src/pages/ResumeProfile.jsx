import React, { useEffect, useState } from 'react';
import { 
  User, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Linkedin, 
  Github, 
  Globe, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  FileText,
  Sparkles
} from 'lucide-react';
import api, { API_URL } from '../services/api';

const ResumeProfile = () => {
  const [profile, setProfile] = useState({
    photo: '',
    resumeUrl: '',
    resumePath: '',
    education: [],
    experience: [],
    skills: [],
    softSkills: [],
    certifications: [],
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleParseResume = async () => {
    if (!profile.resumePath) return;
    setParsing(true);
    setError('');
    setSuccess('');
    try {
      const parsedData = await api.parseResume(profile.resumePath);
      
      const mappedEducation = (parsedData.education || []).map(edu => ({
        degree: edu.degree || '',
        school: edu.institution || edu.school || '',
        year: edu.year || ''
      }));
      
      const mappedExperience = (parsedData.experience || []).map(exp => ({
        role: exp.role || '',
        company: exp.company || '',
        years: exp.duration || exp.years || ''
      }));

      setProfile({
        ...profile,
        skills: parsedData.skills || [],
        softSkills: parsedData.softSkills || [],
        education: mappedEducation,
        experience: mappedExperience,
        certifications: parsedData.certifications || []
      });
      setSuccess('⚡ AI parsed resume data successfully! Review details in the form below before saving.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to parse resume with AI.');
    } finally {
      setParsing(false);
    }
  };

  // Input states for lists
  const [skillInput, setSkillInput] = useState('');
  const [softSkillInput, setSoftSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');

  // Education entry form
  const [eduDegree, setEduDegree] = useState('');
  const [eduSchool, setEduSchool] = useState('');
  const [eduYear, setEduYear] = useState('');

  // Experience entry form
  const [expRole, setExpRole] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expYears, setExpYears] = useState('');

  // Resume File
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const me = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
      if (me.profile) {
        setProfile({
          photo: me.profile.photo || '',
          resumeUrl: me.profile.resumeUrl || '',
          resumePath: me.profile.resumePath || '',
          education: me.profile.education || [],
          experience: me.profile.experience || [],
          skills: me.profile.skills || [],
          softSkills: me.profile.softSkills || [],
          certifications: me.profile.certifications || [],
          linkedinUrl: me.profile.linkedinUrl || '',
          githubUrl: me.profile.githubUrl || '',
          portfolioUrl: me.profile.portfolioUrl || ''
        });
      }
    } catch (err) {
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Calculate profile strength
  const calculateStrength = () => {
    let score = 0;
    if (profile.photo) score += 10;
    if (profile.resumePath || profile.resumeUrl) score += 25;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.softSkills && profile.softSkills.length > 0) score += 10;
    if (profile.experience && profile.experience.length > 0) score += 15;
    if (profile.education && profile.education.length > 0) score += 15;
    if (profile.linkedinUrl) score += 5;
    if (profile.githubUrl || profile.portfolioUrl) score += 5;
    return score;
  };

  const strengthScore = calculateStrength();

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const uploadRes = await api.uploadResume(file);
      setProfile({
        ...profile,
        resumePath: uploadRes.filePath,
        resumeUrl: ''
      });
      setSuccess('PDF Resume uploaded successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload PDF resume file');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateProfile(profile);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile modifications');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const split = skillInput.split(',').map(s => s.trim()).filter(Boolean);
    const updated = [...new Set([...profile.skills, ...split])];
    setProfile({ ...profile, skills: updated });
    setSkillInput('');
  };

  const addSoftSkill = (e) => {
    e.preventDefault();
    if (!softSkillInput.trim()) return;
    const split = softSkillInput.split(',').map(s => s.trim()).filter(Boolean);
    const updated = [...new Set([...profile.softSkills, ...split])];
    setProfile({ ...profile, softSkills: updated });
    setSoftSkillInput('');
  };

  const addCertification = (e) => {
    e.preventDefault();
    if (!certInput.trim()) return;
    const split = certInput.split(',').map(s => s.trim()).filter(Boolean);
    const updated = [...new Set([...profile.certifications, ...split])];
    setProfile({ ...profile, certifications: updated });
    setCertInput('');
  };

  const addEducation = (e) => {
    e.preventDefault();
    if (!eduDegree || !eduSchool || !eduYear) return;
    const newEdu = { degree: eduDegree, school: eduSchool, year: eduYear };
    setProfile({ ...profile, education: [...profile.education, newEdu] });
    setEduDegree('');
    setEduSchool('');
    setEduYear('');
  };

  const addExperience = (e) => {
    e.preventDefault();
    if (!expRole || !expCompany || !expYears) return;
    const newExp = { role: expRole, company: expCompany, years: expYears };
    setProfile({ ...profile, experience: [...profile.experience, newExp] });
    setExpRole('');
    setExpCompany('');
    setExpYears('');
  };

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Initializing profile builder...</div>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl relative">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white">Resume & Profile</h1>
          <p className="text-[11px] text-[#666]">Configure your professional background and details</p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
        >
          <Save size={13} />
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {error && <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">{error}</div>}
      {success && <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-400 text-xs font-mono flex items-center gap-1.5"><CheckCircle2 size={12} />{success}</div>}

      {/* METRICS STRENGTH METER */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs font-semibold text-white">Profile Completion Strength</span>
            <span className="text-xs font-mono font-bold text-amber-500">{strengthScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${strengthScore}%` }}></div>
          </div>
        </div>
        <div className="text-[10px] text-[#666] max-w-sm leading-snug font-mono">
          {strengthScore < 100 ? (
            <span>Missing: {(!profile.photo && 'Photo, ') || (!profile.resumePath && 'Resume PDF, ') || (profile.skills.length === 0 && 'Tech Skills, ') || (profile.experience.length === 0 && 'Experience, ') || 'details to reach 100%'}</span>
          ) : (
            <span className="text-emerald-400 font-semibold">✓ Profile completely filled! Ready for hiring managers.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: Photo, Resume, Socials */}
        <div className="flex flex-col gap-4">
          
          {/* Avatar and Resume Uploader */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-4">
            {/* Profile image URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Profile Photo URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={profile.photo}
                  onChange={(e) => setProfile({ ...profile, photo: e.target.value })}
                  placeholder="https://image-link.com/avatar.jpg"
                  className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
                />
              </div>
              {profile.photo && (
                <img src={profile.photo} alt="Avatar" className="w-12 h-12 rounded-full border border-[#2e2e2e] object-cover mt-1" />
              )}
            </div>

            {/* Resume Upload */}
            <div className="border-t border-[#2e2e2e]/50 pt-3 flex flex-col gap-2">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Resume PDF Document</label>
              
              {profile.resumePath ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-2 bg-[#141414] border border-[#2a2a2a] rounded text-xs">
                    <div className="flex items-center gap-1.5 text-amber-500 font-medium truncate">
                      <FileText size={13} />
                      <span className="truncate">Resume PDF Uploaded</span>
                    </div>
                    <button
                      onClick={() => setProfile({ ...profile, resumePath: '' })}
                      className="p-1 hover:bg-[#222] text-[#888] hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleParseResume}
                    disabled={parsing}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 hover:text-amber-500 text-[10px] font-semibold font-mono rounded transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Sparkles size={11} className={parsing ? 'animate-spin' : ''} />
                    <span>{parsing ? 'AI is analyzing your resume...' : 'Analyze Resume with AI'}</span>
                  </button>
                </div>
              ) : (
                <div className="relative border border-dashed border-[#2a2a2a] bg-[#121212] rounded p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[#161616] transition-colors group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={14} className="text-[#555] group-hover:text-amber-500 transition-colors" />
                  <span className="text-[10px] text-[#888] font-mono select-none">
                    {uploading ? 'Uploading...' : 'Click to Upload PDF'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Socials / Portfolios */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-3">
            <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1">External Links</h2>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#a1a1aa] uppercase font-mono tracking-wider flex items-center gap-1">
                <Linkedin size={11} className="text-[#666]" />
                <span>LinkedIn Profile</span>
              </label>
              <input
                type="url"
                value={profile.linkedinUrl}
                onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/alex"
                className="bg-[#121212] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#a1a1aa] uppercase font-mono tracking-wider flex items-center gap-1">
                <Github size={11} className="text-[#666]" />
                <span>GitHub Profile</span>
              </label>
              <input
                type="url"
                value={profile.githubUrl}
                onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                placeholder="https://github.com/alex"
                className="bg-[#121212] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#a1a1aa] uppercase font-mono tracking-wider flex items-center gap-1">
                <Globe size={11} className="text-[#666]" />
                <span>Portfolio Website</span>
              </label>
              <input
                type="url"
                value={profile.portfolioUrl}
                onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                placeholder="https://alexportfolio.com"
                className="bg-[#121212] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
              />
            </div>
          </div>
        </div>

        {/* Middle and Right: Work experience, education, skills */}
        <div className="md:col-span-2 flex flex-col gap-4">
          
          {/* Work Experience */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-3">
            <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1">Work Experience</h2>
            
            {/* List */}
            {profile.experience.length > 0 ? (
              <div className="flex flex-col gap-2">
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[#141414] border border-[#2a2a2a] rounded text-xs">
                    <div>
                      <h4 className="font-bold text-white">{exp.role}</h4>
                      <p className="text-[#888] font-mono text-[10px] mt-0.5">{exp.company} ({exp.years})</p>
                    </div>
                    <button
                      onClick={() => setProfile({ ...profile, experience: profile.experience.filter((_, i) => i !== idx) })}
                      className="p-1 text-[#666] hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[#555] italic font-mono py-1">No work history logged.</p>
            )}

            {/* Form */}
            <form onSubmit={addExperience} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-3 border-t border-[#2e2e2e]/30">
              <input
                type="text"
                placeholder="Role (e.g. React Dev)"
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
                className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
              />
              <input
                type="text"
                placeholder="Company"
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
                className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Duration (e.g. 2 yrs)"
                  value={expYears}
                  onChange={(e) => setExpYears(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
                />
                <button type="submit" className="p-1 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 text-amber-500 rounded">
                  <Plus size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Education history */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-3">
            <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1">Education</h2>
            
            {/* List */}
            {profile.education.length > 0 ? (
              <div className="flex flex-col gap-2">
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[#141414] border border-[#2a2a2a] rounded text-xs">
                    <div>
                      <h4 className="font-bold text-white">{edu.degree}</h4>
                      <p className="text-[#888] font-mono text-[10px] mt-0.5">{edu.school} ({edu.year})</p>
                    </div>
                    <button
                      onClick={() => setProfile({ ...profile, education: profile.education.filter((_, i) => i !== idx) })}
                      className="p-1 text-[#666] hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[#555] italic font-mono py-1">No education entries logged.</p>
            )}

            {/* Form */}
            <form onSubmit={addEducation} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-3 border-t border-[#2e2e2e]/30">
              <input
                type="text"
                placeholder="Degree (e.g. BS CS)"
                value={eduDegree}
                onChange={(e) => setEduDegree(e.target.value)}
                className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
              />
              <input
                type="text"
                placeholder="University"
                value={eduSchool}
                onChange={(e) => setEduSchool(e.target.value)}
                className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Grad Year (e.g. 2024)"
                  value={eduYear}
                  onChange={(e) => setEduYear(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
                />
                <button type="submit" className="p-1 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 text-amber-500 rounded">
                  <Plus size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Technical & Soft Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Tech Skills */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-3">
              <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1">Technical Skills</h2>
              
              <div className="flex flex-wrap gap-1 min-h-12 border border-[#2a2a2a] bg-[#121212] p-2 rounded">
                {profile.skills.length > 0 ? (
                  profile.skills.map((s, idx) => (
                    <span key={idx} className="bg-[#242424] border border-[#2a2a2a] text-[#a1a1aa] text-[9px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                      <span>{s}</span>
                      <button type="button" onClick={() => setProfile({ ...profile, skills: profile.skills.filter((_, i) => i !== idx) })} className="hover:text-red-400">✕</button>
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-[#555] italic font-mono">No tech skills added.</span>
                )}
              </div>

              <form onSubmit={addSkill} className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="React, CSS3, Go..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
                />
                <button type="submit" className="p-1 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 text-amber-500 rounded">
                  <Plus size={14} />
                </button>
              </form>
            </div>

            {/* Soft Skills */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-3">
              <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1">Soft Skills</h2>
              
              <div className="flex flex-wrap gap-1 min-h-12 border border-[#2a2a2a] bg-[#121212] p-2 rounded">
                {profile.softSkills && profile.softSkills.length > 0 ? (
                  profile.softSkills.map((s, idx) => (
                    <span key={idx} className="bg-[#242424] border border-[#2a2a2a] text-[#a1a1aa] text-[9px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                      <span>{s}</span>
                      <button type="button" onClick={() => setProfile({ ...profile, softSkills: profile.softSkills.filter((_, i) => i !== idx) })} className="hover:text-red-400">✕</button>
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-[#555] italic font-mono">No soft skills added.</span>
                )}
              </div>

              <form onSubmit={addSoftSkill} className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="Leadership, agile..."
                  value={softSkillInput}
                  onChange={(e) => setSoftSkillInput(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
                />
                <button type="submit" className="p-1 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 text-amber-500 rounded">
                  <Plus size={14} />
                </button>
              </form>
            </div>

          </div>

          {/* Certifications */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-3">
            <h2 className="text-xs font-mono text-white uppercase tracking-wider border-b border-[#2e2e2e]/50 pb-1">Certifications</h2>
            
            <div className="flex flex-wrap gap-1 min-h-12 border border-[#2a2a2a] bg-[#121212] p-2 rounded">
              {profile.certifications && profile.certifications.length > 0 ? (
                profile.certifications.map((c, idx) => (
                  <span key={idx} className="bg-[#242424] border border-[#2a2a2a] text-[#a1a1aa] text-[9px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                    <span>{c}</span>
                    <button type="button" onClick={() => setProfile({ ...profile, certifications: profile.certifications.filter((_, i) => i !== idx) })} className="hover:text-red-400">✕</button>
                  </span>
                ))
              ) : (
                <span className="text-[9px] text-[#555] italic font-mono">No certifications added.</span>
              )}
            </div>

            <form onSubmit={addCertification} className="flex gap-1.5 mt-1">
              <input
                type="text"
                placeholder="AWS Cloud, Scrum Master..."
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder-[#444]"
              />
              <button type="submit" className="p-1 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 text-amber-500 rounded">
                <Plus size={14} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResumeProfile;
