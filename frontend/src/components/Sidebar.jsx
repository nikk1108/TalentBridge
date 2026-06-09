import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  PlusCircle, 
  LogOut, 
  Bookmark, 
  User, 
  Award, 
  Calendar, 
  Bell, 
  Settings, 
  BarChart3, 
  Building, 
  FileText 
} from 'lucide-react';
import api from '../services/api';
import Logo from './Logo';

const Sidebar = () => {
  const user = api.getCurrentUser();
  const isRecruiter = user?.role === 'recruiter';

  const handleLogout = () => {
    api.logout();
  };

  // Nav paths based on role
  const navItems = isRecruiter
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/jobs', label: 'Jobs', icon: Briefcase },
        { path: '/candidates', label: 'Candidates', icon: Users },
        { path: '/interview-center', label: 'Interviews', icon: Calendar },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/company-profile', label: 'Company Profile', icon: Building },
        { path: '/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/jobs', label: 'Browse Jobs', icon: Briefcase },
        { path: '/applications', label: 'My Applications', icon: FileText },
        { path: '/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
        { path: '/resume-profile', label: 'Resume & Profile', icon: User },
        { path: '/skill-assessment', label: 'Skill Assessment', icon: Award },
        { path: '/interview-center', label: 'Interview Center', icon: Calendar },
        { path: '/notifications', label: 'Notifications', icon: Bell },
        { path: '/settings', label: 'Settings', icon: Settings },
      ];

  return (
    <aside className="w-56 h-screen bg-[#1a1a1a] border-r border-[#2e2e2e] flex flex-col justify-between select-none">
      {/* Upper Section */}
      <div className="flex flex-col pt-4">
        {/* Logo / Title */}
        <div className="px-5 mb-6 flex items-center gap-2">
          <Logo size={20} />
          <span className="text-white font-bold tracking-wider text-sm uppercase">TalentBridge</span>
        </div>

        {/* Quick Actions (Recruiter Only) */}
        {isRecruiter && (
          <div className="px-3 mb-4">
            <NavLink
              to="/jobs/new"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md w-full transition-colors border ${
                  isActive
                    ? 'bg-amber-600/10 border-amber-500/40 text-amber-500'
                    : 'bg-[#222] border-[#2e2e2e] hover:bg-[#2a2a2a] text-[#e4e4e7] hover:text-white'
                }`
              }
            >
              <PlusCircle size={14} className="flex-shrink-0" />
              <span>Create Job Opening</span>
            </NavLink>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#262626] text-white'
                      : 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f1f]'
                  }`
                }
              >
                <Icon size={14} className="flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Section (User Profile) */}
      <div className="p-3 border-t border-[#2e2e2e] bg-[#161616] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-white text-xs font-semibold truncate leading-none mb-1">
              {user?.name || 'Recruiter'}
            </span>
            <span className="text-[#888] text-[10px] truncate leading-none">
              {user?.email || 'recruiter@company.com'}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1 hover:bg-[#2c2c2c] rounded-md text-[#a1a1aa] hover:text-[#ef4444] transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 py-0.5 px-1.5 bg-[#222] border border-[#2e2e2e] rounded text-[9px] text-[#888] font-mono leading-none">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
          <span className="capitalize">Role: {user?.role || 'candidate'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
