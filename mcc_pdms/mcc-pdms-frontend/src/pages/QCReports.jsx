import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import client from '../api/client';

export function QCReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const { data } = await client.get('/qc-reports/');
        setReports(data.results || data);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">QC Reports</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Batch</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Predicted</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Probability</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{report.batch.batch_no}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      report.predicted_pass
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {report.predicted_pass ? 'Pass' : 'Fail'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{report.predicted_probability?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">{report.actual_result || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
