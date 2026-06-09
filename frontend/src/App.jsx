import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import Candidates from './pages/Candidates';
import CandidateProfile from './pages/CandidateProfile';
import JobDetails from './pages/JobDetails';
import MyApplications from './pages/MyApplications';
import SavedJobs from './pages/SavedJobs';
import ResumeProfile from './pages/ResumeProfile';
import SkillAssessment from './pages/SkillAssessment';
import InterviewCenter from './pages/InterviewCenter';
import NotificationsPage from './pages/NotificationsPage';
import CompanyProfile from './pages/CompanyProfile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected recruiter/candidate workspace */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <JobDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/new"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <Layout>
                <CreateJob />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <Layout>
                <CreateJob />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidates"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <Layout>
                <Candidates />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidates/:id"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <Layout>
                <CandidateProfile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Candidate Portal Pages */}
        <Route
          path="/applications"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <Layout>
                <MyApplications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-jobs"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <Layout>
                <SavedJobs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-profile"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <Layout>
                <ResumeProfile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-assessment"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <Layout>
                <SkillAssessment />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Shared / Route-Specific Pages */}
        <Route
          path="/interview-center"
          element={
            <ProtectedRoute>
              <Layout>
                <InterviewCenter />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Recruiter Expanded Pages */}
        <Route
          path="/company-profile"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <Layout>
                <CompanyProfile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Global Redirect Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
