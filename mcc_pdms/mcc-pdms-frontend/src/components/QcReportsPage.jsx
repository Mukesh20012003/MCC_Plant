// src/components/QcReportsPage.jsx
import { useEffect, useState } from "react";
import { fetchQcReports } from "../services/api";

function QcReportsPage() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("ALL");

  useEffect(() => {
    fetchQcReports()
      .then((data) => {
        setReports(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  const visibleReports = reports.filter((r) => {
    if (mode === "PASS") return r.predicted_pass === true;
    if (mode === "FAIL") return r.predicted_pass === false;
    return true;
  });

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">QC Reports</h2>
        <div className="inline-flex rounded-md shadow-sm overflow-hidden text-xs">
          <button
            className={`px-3 py-1 border ${
              mode === "ALL"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-blue-600 border-blue-600"
            }`}
            onClick={() => setMode("ALL")}
          >
            All
          </button>
          <button
            className={`px-3 py-1 border-t border-b ${
              mode === "PASS"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-green-600 border-green-600"
            }`}
            onClick={() => setMode("PASS")}
          >
            Predicted Pass
          </button>
          <button
            className={`px-3 py-1 border ${
              mode === "FAIL"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-red-600 border-red-600"
            }`}
            onClick={() => setMode("FAIL")}
          >
            Predicted Fail
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Batch</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Predicted</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Probability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleReports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{r.batch_no || r.batch}</td>
                <td className="px-4 py-2">
                  {r.predicted_pass == null ? "-" : r.predicted_pass ? "Pass" : "Fail"}
                </td>
                <td className="px-4 py-2">
                  {r.predicted_probability == null
                    ? "-"
                    : r.predicted_probability.toFixed(2)}
                </td>
              </tr>
            ))}
            {visibleReports.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-3 text-center text-gray-500 text-sm">
                  No QC reports match the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QcReportsPage;
