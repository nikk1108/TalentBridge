import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Compass, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  HelpCircle,
  Brain,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Timer,
  XCircle
} from 'lucide-react';
import api from '../services/api';

const SkillAssessment = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Assessment State
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionIndex
  const [assessmentStatus, setAssessmentStatus] = useState('idle'); // 'idle' | 'loading_questions' | 'answering' | 'submitting' | 'result'
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentError, setAssessmentError] = useState('');

  const loadData = async () => {
    try {
      const me = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
      setUserProfile(me);
      
      const activeJobs = await api.getJobs();
      setJobs(Array.isArray(activeJobs) ? activeJobs.filter(j => j.status === 'Active') : []);
    } catch (err) {
      setError('Failed to load diagnostic profile metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartAssessment = async () => {
    setAssessmentStatus('loading_questions');
    setAssessmentError('');
    try {
      const skills = userProfile?.profile?.skills || [];
      const questionsData = await api.generateAssessmentQuestions(skills);
      if (Array.isArray(questionsData) && questionsData.length > 0) {
        setQuestions(questionsData);
        setAnswers({});
        setCurrentQuestionIdx(0);
        setAssessmentStatus('answering');
      } else {
        throw new Error('No assessment questions returned.');
      }
    } catch (err) {
      setAssessmentError(err.message || 'Failed to start AI interview assessment prep loop.');
      setAssessmentStatus('idle');
    }
  };

  const handleSelectOption = (questionId, optionIdx) => {
    setAnswers({
      ...answers,
      [questionId]: optionIdx
    });
  };

  const handleSubmitAssessment = async () => {
    // Check that all 5 questions have been answered
    const unanswered = questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      setAssessmentError('Please complete all questions before submitting.');
      return;
    }

    setAssessmentStatus('submitting');
    setAssessmentError('');
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        selectedOption: answers[q.id]
      }));
      const result = await api.evaluateAssessmentAnswers(formattedAnswers);
      setAssessmentResult(result);
      setAssessmentStatus('result');
    } catch (err) {
      setAssessmentError(err.message || 'Failed to score answers.');
      setAssessmentStatus('answering');
    }
  };

  const handleResetAssessment = () => {
    setQuestions([]);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setAssessmentResult(null);
    setAssessmentStatus('idle');
    setAssessmentError('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="text-xs font-mono text-[#888] animate-pulse">Computing diagnostic metrics...</div>
      </div>
    );
  }

  const technicalSkills = userProfile?.profile?.skills || [];
  const softSkills = userProfile?.profile?.softSkills || [];
  const totalSkillsCount = technicalSkills.length + softSkills.length;

  // Calculate readiness score
  const techScore = Math.min(60, technicalSkills.length * 6);
  const softScore = Math.min(40, softSkills.length * 8);
  const readinessScore = techScore + softScore;

  // Compare profile skills against active jobs to suggest average match score
  let averageReadiness = 0;
  if (jobs.length > 0 && technicalSkills.length > 0) {
    const normalize = str => str.toLowerCase().replace(/[^a-z0-9#+]/g, '').trim();
    const normUser = technicalSkills.map(normalize);
    
    let scoresSum = 0;
    jobs.forEach(job => {
      if (job.skills?.length > 0) {
        const matches = job.skills.filter(s => normUser.includes(normalize(s)));
        scoresSum += Math.round((matches.length / job.skills.length) * 100);
      }
    });
    averageReadiness = Math.round(scoresSum / jobs.length);
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl relative pb-8">
      {/* Title */}
      <div className="border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Skill Assessment & Prep</h1>
        <p className="text-[11px] text-[#666]">AI-powered check of profile readiness and interactive interview simulator</p>
      </div>

      {error && (
        <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
          Error: {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Side: Score & Stats (Profile Diagnostics) */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col items-center justify-between min-h-[300px] border-l-2 border-l-amber-500">
            <div className="w-full text-center">
              <span className="text-[9px] font-mono text-[#888] uppercase tracking-wider block mb-1">AI Match Readiness Index</span>
              <div className="relative w-32 h-32 mx-auto mt-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="#222" strokeWidth="6" fill="transparent" />
                  <circle cx="64" cy="64" r="54" stroke="#F59E0B" strokeWidth="6" fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - readinessScore / 100)}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold text-white font-mono leading-none">{readinessScore}%</span>
                  <span className="block text-[8px] font-mono text-[#666] mt-0.5">Profile Strength</span>
                </div>
              </div>
            </div>

            <div className="w-full border-t border-[#2e2e2e]/30 pt-4 mt-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#888]">Logged Tech Skills:</span>
                <span className="font-bold text-white">{technicalSkills.length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#888]">Logged Soft Skills:</span>
                <span className="font-bold text-white">{softSkills.length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#888]">Avg Opening Match:</span>
                <span className="font-bold text-amber-500">{averageReadiness}%</span>
              </div>
            </div>
          </div>

          {/* Tips Widget */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 text-[10px] text-[#888] leading-relaxed flex items-start gap-2.5">
            <HelpCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">Diagnostic Guide</span> 
              Add missing skills specified in active job specifications directly to your <Link to="/resume-profile" className="text-amber-500 hover:underline">Resume & Profile</Link>. The matching engine computes changes instantly.
            </div>
          </div>
        </div>

        {/* Right Side: Assessment Sandbox or Skills Overview */}
        <div className="md:col-span-2 flex flex-col gap-4">
          
          {/* INTERACTIVE ASSESSMENT SIMULATOR BOX */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 relative overflow-hidden flex flex-col min-h-[300px]">
            
            {/* Header indicator */}
            <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-2 mb-4">
              <span className="text-xs font-mono text-white uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Brain size={14} className="text-[#FB7185]" />
                <span>AI Technical Prep Assessment</span>
              </span>
              {assessmentStatus === 'answering' && (
                <span className="text-[10px] font-mono text-[#888]">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </span>
              )}
            </div>

            {assessmentError && (
              <div className="p-2 mb-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono flex items-center gap-1.5">
                <AlertCircle size={12} />
                <span>{assessmentError}</span>
              </div>
            )}

            {/* SCREEN 1: IDLE */}
            {assessmentStatus === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-[#FB7185]/10 border border-[#FB7185]/20 flex items-center justify-center mb-3 text-[#FB7185]">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Assess Interview Readiness</h3>
                <p className="text-[10px] text-[#666] max-w-sm mb-4 leading-relaxed">
                  Generate a dynamic assessment loop covering your technical profile skills ({technicalSkills.length > 0 ? technicalSkills.slice(0, 3).join(', ') : 'Software principles'}). Test yourself against realistic hiring queries.
                </p>
                <button
                  onClick={handleStartAssessment}
                  className="px-5 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-[#FB7185]/10 hover:border-[#FB7185]/40 hover:text-[#FB7185] text-white rounded text-xs font-mono transition-all font-semibold"
                >
                  Start Assessment
                </button>
              </div>
            )}

            {/* SCREEN 2: LOADING */}
            {assessmentStatus === 'loading_questions' && (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-[10px] font-mono text-[#888]">Analyzing profile skills & assembling questions...</span>
              </div>
            )}

            {/* SCREEN 3: ANSWERING */}
            {assessmentStatus === 'answering' && questions.length > 0 && (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* Question Block */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-emerald-950/20 text-[#10B981] border border-emerald-500/20 rounded text-[9px] font-mono font-bold">
                      {questions[currentQuestionIdx].skill}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-relaxed">
                    {questions[currentQuestionIdx].question}
                  </h4>
                  
                  {/* Options List */}
                  <div className="flex flex-col gap-2 mt-2">
                    {questions[currentQuestionIdx].options.map((opt, oIdx) => {
                      const qId = questions[currentQuestionIdx].id;
                      const selected = answers[qId] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(qId, oIdx)}
                          className={`w-full text-left p-3 rounded border text-xs font-medium transition-all ${
                            selected
                              ? 'bg-amber-600/10 border-amber-500/50 text-amber-500 font-semibold'
                              : 'bg-[#141414] border-[#2e2e2e] text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-white'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`w-4 h-4 rounded-full border text-[9px] font-mono flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              selected ? 'border-amber-500 text-amber-500 bg-amber-500/10 font-bold' : 'border-[#3c3c3c] text-[#666]'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center border-t border-[#2e2e2e]/30 pt-4 mt-6">
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="flex items-center gap-1 px-3 py-1 bg-[#141414] border border-[#2e2e2e] rounded text-[10px] text-[#888] hover:text-white hover:bg-[#222] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={12} />
                    <span>Back</span>
                  </button>

                  {currentQuestionIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="flex items-center gap-1 px-3 py-1 bg-[#141414] border border-[#2e2e2e] rounded text-[10px] text-[#888] hover:text-white hover:bg-[#222] transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitAssessment}
                      className="px-4 py-1 bg-[#10B981] hover:bg-[#10B981]/90 text-white rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} />
                      <span>Submit Prep Assessment</span>
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* SCREEN 4: SUBMITTING */}
            {assessmentStatus === 'submitting' && (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-[10px] font-mono text-[#888]">Scoring questions & building AI review breakdown...</span>
              </div>
            )}

            {/* SCREEN 5: RESULTS SCREEN */}
            {assessmentStatus === 'result' && assessmentResult && (
              <div className="flex-1 flex flex-col gap-4">
                
                {/* Result header banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#141414] border border-[#2a2a2a] rounded">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">Performance Metric</h4>
                    <p className="text-[10px] text-[#888] max-w-sm leading-relaxed">{assessmentResult.feedback}</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-mono font-bold border ${
                      assessmentResult.score >= 80 
                        ? 'bg-emerald-950/20 text-[#10B981] border-emerald-500/20' 
                        : assessmentResult.score >= 60 
                          ? 'bg-amber-950/20 text-[#F59E0B] border-amber-500/20' 
                          : 'bg-red-950/20 text-[#FB7185] border-red-500/20'
                    }`}>
                      {assessmentResult.score}%
                    </span>
                    <span className="block text-[8px] font-mono text-[#555] mt-1">Score: {assessmentResult.correctCount}/5 Correct</span>
                  </div>
                </div>

                {/* Question Feedback review breakdown */}
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {assessmentResult.details && assessmentResult.details.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#121212] border border-[#2e2e2e]/60 rounded text-xs flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] text-[#a1a1aa] font-bold">Question {idx + 1} ({item.skill})</span>
                        <span className={`flex items-center gap-1 text-[9px] font-mono font-semibold ${
                          item.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {item.isCorrect ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={11} />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-white text-[11px] font-semibold">{item.question}</p>
                      
                      <div className="text-[10px] flex flex-col gap-1 font-mono border-t border-[#222] pt-1.5 mt-0.5">
                        <div className="flex gap-1.5">
                          <span className="text-[#666]">Correct Answer:</span>
                          <span className="text-emerald-400 font-medium">{item.correctAnswerText}</span>
                        </div>
                        {!item.isCorrect && (
                          <div className="flex gap-1.5">
                            <span className="text-[#666]">Your Answer:</span>
                            <span className="text-rose-400 font-medium">{item.userAnswer !== -1 ? 'Option ' + String.fromCharCode(65 + item.userAnswer) : 'No answer'}</span>
                          </div>
                        )}
                        <p className="text-[#888] font-sans text-[10px] mt-1 leading-relaxed bg-[#141414] p-2 rounded border border-[#222]">
                          <span className="font-semibold text-white block mb-0.5">Explanation:</span>
                          {item.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleResetAssessment}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-[#F59E0B]/10 hover:border-amber-500/40 hover:text-amber-500 text-white rounded text-xs font-mono font-semibold transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span>Try Another Test</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* VERIFIED SKILLS LOG & RECOMMENDATIONS */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-4 border-t-2 border-t-[#10B981]">
            
            {/* Tech & Soft listings */}
            <div>
              <h2 className="text-xs font-mono text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Award size={13} className="text-amber-500" />
                <span>Verified Candidate Skills Log</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                {/* Tech list */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[#666] font-mono uppercase">Technical (Hard) Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {technicalSkills.length > 0 ? (
                      technicalSkills.map((s, idx) => (
                        <span key={idx} className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#555] italic font-mono">None logged. Update profile.</span>
                    )}
                  </div>
                </div>

                {/* Soft list */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[#666] font-mono uppercase">Behavioral (Soft) Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {softSkills.length > 0 ? (
                      softSkills.map((s, idx) => (
                        <span key={idx} className="bg-amber-950/20 border border-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#555] italic font-mono">None logged. Update profile.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended next steps based on jobs */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-3">
            <h2 className="text-xs font-mono text-white uppercase tracking-wider mb-1">Recommended Roles to Target</h2>
            
            {jobs.length > 0 ? (
              <div className="flex flex-col gap-2.5 mt-2">
                {jobs.slice(0, 3).map((job) => {
                  const normalize = str => str.toLowerCase().replace(/[^a-z0-9#+]/g, '').trim();
                  const normUser = technicalSkills.map(normalize);
                  const matched = job.skills ? job.skills.filter(s => normUser.includes(normalize(s))) : [];
                  const score = job.skills?.length > 0 ? Math.round((matched.length / job.skills.length) * 100) : 0;

                  return (
                    <div key={job._id} className="p-3 bg-[#141414] border border-[#2a2a2a] rounded flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-white leading-snug">{job.title}</h4>
                        <p className="text-[10px] text-[#666] font-mono mt-0.5">{job.companyName} – {job.department}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${
                          score >= 70 ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' : 'bg-[#2a2a2a] text-[#888] border-[#3c3c3c]'
                        }`}>
                          {score}% Match
                        </span>
                        <Link to={`/jobs/${job._id}`} className="p-1 hover:bg-[#222] rounded text-[#888] hover:text-white transition-colors">
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-[#555] italic font-mono">No active jobs posted at the moment.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SkillAssessment;
