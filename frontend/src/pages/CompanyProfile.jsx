import React, { useEffect, useState } from 'react';
import { Building2, Globe, FileText, CheckCircle2, Save } from 'lucide-react';
import api from '../services/api';

const CompanyProfile = () => {
  const [company, setCompany] = useState({
    name: '',
    logo: '',
    website: '',
    description: '',
    industry: '',
    size: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCompanyDetails = async () => {
    try {
      const me = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
      if (me.company) {
        setCompany({
          name: me.company.name || '',
          logo: me.company.logo || '',
          website: me.company.website || '',
          description: me.company.description || '',
          industry: me.company.industry || '',
          size: me.company.size || ''
        });
      }
    } catch (err) {
      setError('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.name) {
      return setError('Company Name is required.');
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.updateProfile(company);
      setSuccess('Company profile saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Loading company dossier...</div>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl relative">
      <div className="border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Company Profile</h1>
        <p className="text-[11px] text-[#666]">Configure company-wide specifications and branding metadata</p>
      </div>

      {error && <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">{error}</div>}
      {success && <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-400 text-xs font-mono flex items-center gap-1.5"><CheckCircle2 size={12} />{success}</div>}

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-5 flex flex-col gap-4">
        
        {/* Row 1: Logo & Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Company Name</label>
            <input
              type="text"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Company Logo URL</label>
            <input
              type="url"
              value={company.logo}
              onChange={(e) => setCompany({ ...company, logo: e.target.value })}
              placeholder="https://acme.com/logo.png"
              className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
            />
          </div>
        </div>

        {/* Row 2: Website & Size */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Company Website</label>
            <input
              type="url"
              value={company.website}
              onChange={(e) => setCompany({ ...company, website: e.target.value })}
              placeholder="https://acme.com"
              className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Industry</label>
            <input
              type="text"
              value={company.industry}
              onChange={(e) => setCompany({ ...company, industry: e.target.value })}
              placeholder="e.g. Enterprise Software"
              className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Company Size</label>
            <select
              value={company.size}
              onChange={(e) => setCompany({ ...company, size: e.target.value })}
              className="bg-[#121212] border border-[#2a2a2a] text-xs text-[#a1a1aa] rounded px-3 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="">Select Size</option>
              <option value="1-10 employees">1-10 employees</option>
              <option value="11-50 employees">11-50 employees</option>
              <option value="51-200 employees">51-200 employees</option>
              <option value="201-500 employees">201-500 employees</option>
              <option value="500+ employees">500+ employees</option>
            </select>
          </div>
        </div>

        {/* Row 3: Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">Company Description</label>
          <textarea
            value={company.description}
            onChange={(e) => setCompany({ ...company, description: e.target.value })}
            rows={5}
            placeholder="Acme Corp builds modern developer tools..."
            className="bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 placeholder-[#444] font-sans"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3 border-t border-[#2e2e2e]/50 mt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
          >
            <Save size={13} />
            <span>{saving ? 'Saving...' : 'Save Company Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfile;
