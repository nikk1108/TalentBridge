import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate'); // 'candidate' or 'recruiter'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Please fill in all fields');
    }

    setError('');
    setLoading(true);
    try {
      await api.register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4 font-sans">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-6 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Logo size={24} />
          <span className="text-white font-bold tracking-wider text-sm uppercase">TalentBridge</span>
        </div>

        <h2 className="text-md font-semibold text-white mb-1">Create your profile</h2>
        <p className="text-xs text-[#888] mb-5">Set up your account to get started</p>

        {error && (
          <div className="mb-4 p-2 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Role Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`py-1.5 rounded text-xs font-medium border transition-colors focus:outline-none ${
                  role === 'candidate'
                    ? 'bg-amber-600/10 border-amber-500/40 text-amber-500'
                    : 'bg-[#121212] border-[#2e2e2e] text-[#a1a1aa] hover:text-white'
                }`}
              >
                Candidate (Applicant)
              </button>
              <button
                type="button"
                onClick={() => setRole('recruiter')}
                className={`py-1.5 rounded text-xs font-medium border transition-colors focus:outline-none ${
                  role === 'recruiter'
                    ? 'bg-amber-600/10 border-amber-500/40 text-amber-500'
                    : 'bg-[#121212] border-[#2e2e2e] text-[#a1a1aa] hover:text-white'
                }`}
              >
                Recruiter (Hiring Team)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
              placeholder="Sarah Jenkins"
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
              placeholder="s.jenkins@company.com"
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 hover:text-amber-500 text-[#e4e4e7] py-2 rounded text-xs font-medium transition-all focus:outline-none"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs border-t border-[#2e2e2e]/50 pt-4">
          <span className="text-[#666]">Already have a profile? </span>
          <Link to="/login" className="text-amber-500 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
