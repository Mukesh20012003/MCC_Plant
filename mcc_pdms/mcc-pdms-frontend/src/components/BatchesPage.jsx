// src/components/BatchesPage.jsx
import { useEffect, useState } from "react";
import { fetchBatches, detectAnomaly } from "../services/api";
import { AnomalyButton } from "./AnomalyButton";

function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [anomalyMap, setAnomalyMap] = useState({});

  const handleCheckAnomaly = async (batchId) => {
    try {
      const res = await detectAnomaly(batchId);
      setAnomalyMap((prev) => ({
        ...prev,
        [batchId]: { score: res.score, is_anomaly: res.is_anomaly },
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to check anomaly");
    }
  };

  useEffect(() => {
    fetchBatches()
      .then((data) => {
        setBatches(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (error)
    return <p className="text-center mt-10 text-red-600">{error}</p>;

  const visibleBatches = batches.filter((b) => {
    const matchesSearch =
      !search ||
      b.batch_no.toLowerCase().includes(search.toLowerCase()) ||
      (b.raw_material_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          All Production Batches
        </h2>
        <div className="flex gap-2">
          <input
            className="border border-gray-300 rounded-md px-3 py-1 text-sm w-52"
            placeholder="Search batch or material"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Batch
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Raw Material
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Start
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  End
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Anomaly
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleBatches.map((b) => {
                const anomaly = anomalyMap[b.id];
                const isFailed = b.status === "FAILED";
                const isAnomaly = anomaly?.is_anomaly;

                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-gray-50 transition ${
                      isAnomaly
                        ? "border-l-4 border-l-red-500 bg-red-50/60"
                        : isFailed
                        ? "bg-red-50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-2">{b.batch_no}</td>
                    <td className="px-4 py-2">
                      {b.raw_material_name || b.raw_material}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          b.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : b.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{b.start_time}</td>
                    <td className="px-4 py-2">{b.end_time}</td>
                    <td className="px-4 py-2">
                      <AnomalyButton
                        batchId={b.id}
                        // optional: also trigger map update to highlight row
                        onChecked={() => handleCheckAnomaly(b.id)}
                      />
                    </td>
                  </tr>
                );
              })}
              {visibleBatches.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                  >
                    No batches match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BatchesPage;
