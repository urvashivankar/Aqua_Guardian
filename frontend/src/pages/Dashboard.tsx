import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CitizenDashboard from './CitizenDashboard';
import NGODashboard from './NGODashboard';
import GovernmentDashboard from './GovernmentDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // If user is loading or undefined initially (though AuthContext handles this usually), show loader
  if (!user && sessionStorage.getItem('sb-access-token')) {
    // Small edge case where user is rehydrating
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-ocean-primary" /></div>;
  }

  // Default to citizen if no role found
  const role = user?.role || 'Citizen';

  // Render appropriate dashboard based on role case-insensitively
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === 'government') {
    return <GovernmentDashboard />;
  }

  if (normalizedRole === 'ngo') {
    return <NGODashboard />;
  }

  // Default fallback for 'citizen', 'student', 'other'
  return <CitizenDashboard />;
};

export default Dashboard;