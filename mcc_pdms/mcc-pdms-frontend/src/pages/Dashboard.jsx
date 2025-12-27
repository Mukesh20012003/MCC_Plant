import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BarChart3, Users, CheckCircle, TrendingUp } from 'lucide-react';
import client from '../api/client';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [batches, qcReports] = await Promise.all([
          client.get('/batches/'),
          client.get('/qc-reports/'),
        ]);
        setStats({
          totalBatches: batches.data.count || 0,
          predictedPass: qcReports.data.filter((r) => r.predicted_pass).length,
          qcReports: qcReports.data.length,
          availability: 82,
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Batches" value={stats?.totalBatches} icon={<BarChart3 />} />
        <StatCard label="Predicted Pass" value={stats?.predictedPass} icon={<CheckCircle />} />
        <StatCard label="QC Reports" value={stats?.qcReports} icon={<Users />} />
        <StatCard label="Availability" value={`${stats?.availability}%`} icon={<TrendingUp />} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-blue-600 opacity-20">{icon}</div>
      </div>
    </div>
  );
}
