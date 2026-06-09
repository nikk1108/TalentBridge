import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields');
    }
    
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
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

        <h2 className="text-md font-semibold text-white mb-1">Sign in to console</h2>
        <p className="text-xs text-[#888] mb-5">Enter your recruiter credentials below</p>

        {error && (
          <div className="mb-4 p-2 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
              placeholder="name@company.com"
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs border-t border-[#2e2e2e]/50 pt-4">
          <span className="text-[#666]">New to TalentBridge? </span>
          <Link to="/register" className="text-amber-500 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
