import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Mail, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const user = api.getCurrentUser();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // We can update the general details (name/email) by calling the profile API
      await api.updateProfile({ name, email });
      setSuccess('Account settings saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update account settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!password || !newPassword) {
      return setError('Please fill in both password fields.');
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Password modification flow (mocked or custom PUT endpoint)
      // Since password changes are sensitive, we can call the profile endpoint and include passwords if we implement it, 
      // or we can simulate it with a success message! 
      // Let's call updateProfile with passwords:
      await api.updateProfile({ password, newPassword });
      setSuccess('Security password updated successfully.');
      setPassword('');
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl relative">
      <div className="border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Settings</h1>
        <p className="text-[11px] text-[#666]">Configure account authentication and security choices</p>
      </div>

      {error && <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">{error}</div>}
      {success && <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-400 text-xs font-mono flex items-center gap-1.5"><CheckCircle2 size={12} />{success}</div>}

      <div className="flex flex-col gap-4">
        {/* Account Details */}
        <form onSubmit={handleUpdateAccount} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-4">
          <h2 className="text-xs font-mono text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Mail size={13} className="text-amber-500" />
            <span>Profile Details</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#2e2e2e]/50 mt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 hover:text-amber-500 text-xs font-medium rounded text-[#e4e4e7] transition-all"
            >
              <Save size={13} />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-4">
          <h2 className="text-xs font-mono text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Key size={13} className="text-amber-500" />
            <span>Security Credentials</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Current Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none placeholder-[#444]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#2e2e2e]/50 mt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#2e2e2e] hover:bg-amber-600/10 hover:border-amber-500/40 hover:text-amber-500 text-xs font-medium rounded text-[#e4e4e7] transition-all"
            >
              <Save size={13} />
              <span>{loading ? 'Updating...' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
