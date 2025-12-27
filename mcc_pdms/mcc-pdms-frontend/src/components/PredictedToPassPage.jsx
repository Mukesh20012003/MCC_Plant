// src/components/PredictedToPassPage.jsx
import { useEffect, useState } from "react";
import { fetchPredictedPassReports } from "../services/api";

function PredictedToPassPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictedPassReports()
      .then((data) => {
        setRows(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <div className="py-4">
      <h1 className="text-xl font-semibold mb-4 text-gray-900">Predicted to Pass (ML)</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Batch</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Probability</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={
                  r.predicted_probability >= 0.9 ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"
                }
              >
                <td className="px-4 py-2">{r.batch_no}</td>
                <td className="px-4 py-2">
                  {r.predicted_probability == null ? "-" : r.predicted_probability.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-3 text-center text-gray-500 text-sm">
                  No predicted-pass reports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PredictedToPassPage;
