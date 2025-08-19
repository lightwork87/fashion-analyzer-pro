'use client';
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to your dashboard</p>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <a href="/dashboard/analyze-single" className="p-4 border rounded">Single Analysis</a>
        <a href="/dashboard/analyze-batch" className="p-4 border rounded">Batch Analysis</a>
      </div>
    </div>
  );
}
