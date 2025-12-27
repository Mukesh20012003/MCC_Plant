import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import client from '../api/client';

export function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await client.get('/qc-reports/predicted-to-pass/');
        setPredictions(data.results || data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Predicted to Pass</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Batch</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Probability</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {predictions.map((pred) => (
              <tr key={pred.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{pred.batch.batch_no}</td>
                <td className="px-6 py-4 text-sm">{pred.predicted_probability?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">{new Date(pred.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
