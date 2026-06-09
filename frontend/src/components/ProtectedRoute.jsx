import React from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = api.getCurrentUser();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Determine user role (local storage or decoded from JWT payload)
  let role = user?.role;
  if (!role && token) {
    try {
      const payload = token.split('.')[1];
      const base64Url = payload;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
      const decoded = JSON.parse(atob(paddedBase64));
      role = decoded.role;
    } catch (e) {
      console.error('Failed to decode role from token', e);
    }
  }

  // Default to candidate if role is still not defined
  if (!role) {
    role = 'candidate';
  }

  console.log('Current User:', user);
  console.log('Role:', role);
  console.log('Allowed Roles:', allowedRoles);

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If not authorized for this route, redirect to their main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
