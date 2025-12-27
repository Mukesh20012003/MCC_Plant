import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertCircle, CheckCircle } from 'lucide-react';
import client from '../api/client';

export function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState({});

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const { data } = await client.get('/batches/');
        setBatches(data.results || data);
      } catch (error) {
        console.error('Error loading batches:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBatches();
  }, []);

  const checkAnomaly = async (batchId) => {
    try {
      const { data } = await client.post('/ml/detect-anomaly/', { batch_id: batchId });
      setAnomalies((prev) => ({ ...prev, [batchId]: data }));
    } catch (error) {
      console.error('Error checking anomaly:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Production Batches</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Batch No</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Material</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Anomaly</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {batches.map((batch) => {
              const anomaly = anomalies[batch.id];
              return (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{batch.batch_no}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{batch.raw_material}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{batch.status}</td>
                  <td className="px-6 py-4 text-sm">
                    {anomaly ? (
                      <div className="flex items-center gap-2">
                        {anomaly.is_anomaly ? (
                          <>
                            <AlertCircle className="text-red-500" size={18} />
                            <span className="text-red-600 font-medium">High</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="text-green-500" size={18} />
                            <span className="text-green-600 font-medium">Normal</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => checkAnomaly(batch.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Check
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
