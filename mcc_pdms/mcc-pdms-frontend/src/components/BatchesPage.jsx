// src/components/BatchesPage.jsx
import { useEffect, useState } from "react";
import { fetchBatches } from "../services/api";

function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  if (loading) return <p className="text-center mt-5">Loading...</p>;
  if (error) return <p className="text-center text-danger mt-5">{error}</p>;

  const visibleBatches = batches.filter((b) => {
    const matchesSearch =
      !search ||
      b.batch_no.toLowerCase().includes(search.toLowerCase()) ||
      (b.raw_material_name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">All Production Batches</h2>
        <div className="d-flex gap-2">
          <input
            className="form-control form-control-sm"
            placeholder="Search batch or material"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select form-select-sm"
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

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Raw Material</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {visibleBatches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.batch_no}</td>
                    <td>{b.raw_material_name || b.raw_material}</td>
                    <td>
                      <span
                        className={
                          "badge " +
                          (b.status === "COMPLETED"
                            ? "bg-success"
                            : b.status === "FAILED"
                            ? "bg-danger"
                            : "bg-warning text-dark")
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>{b.start_time}</td>
                    <td>{b.end_time}</td>
                  </tr>
                ))}
                {visibleBatches.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No batches match the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchesPage;
