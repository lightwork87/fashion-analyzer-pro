// app/dashboard/layout.js
// Layout with proper navigation

import Navigation from '../components/Navigation';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="ml-64 pt-16">
        {children}
      </div>
    </div>
  );
}