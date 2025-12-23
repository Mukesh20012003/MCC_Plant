// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../services/api";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const load = () => {
      fetchDashboardSummary()
        .then((data) => {
          setSummary(data);
          setLastUpdated(new Date());
        })
        .catch((err) => setError(err.message));
    };

    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  if (error) return <p className="text-center text-danger mt-5">{error}</p>;
  if (!summary) return <p className="text-center mt-5">Loading...</p>;

  const {
    total_batches,
    total_qc_reports,
    predicted_to_pass,
    recent_batches,
  } = summary;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">MCC PDMS React Dashboard</h1>
        {lastUpdated && (
          <small className="text-muted">
            Last updated {lastUpdated.toLocaleTimeString()}
          </small>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Total Batches</h5>
              <p className="display-6 mb-0">{total_batches}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Predicted to Pass</h5>
              <p className="display-6 mb-0 text-success">
                {predicted_to_pass}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">QC Reports</h5>
              <p className="display-6 mb-0">{total_qc_reports}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">Recent Batches</h5>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Status</th>
                  <th>Predicted</th>
                  <th>Probability</th>
                </tr>
              </thead>
              <tbody>
                {recent_batches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.batch_no}</td>
                    <td>{b.status}</td>
                    <td>
                      {b.predicted == null ? "-" : b.predicted ? "Pass" : "Fail"}
                    </td>
                    <td>
                      {b.probability == null
                        ? "-"
                        : b.probability.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {recent_batches.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      No recent batches.
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

export default Dashboard;
