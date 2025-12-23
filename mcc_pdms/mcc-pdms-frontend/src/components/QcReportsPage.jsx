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

  if (loading) return <p className="text-center mt-5">Loading...</p>;
  if (error) return <p className="text-center text-danger mt-5">{error}</p>;

  const visibleReports = reports.filter((r) => {
    if (mode === "PASS") return r.predicted_pass === true;
    if (mode === "FAIL") return r.predicted_pass === false;
    return true;
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h3 mb-0">QC Reports</h2>
        <div className="btn-group btn-group-sm">
          <button
            className={
              "btn " +
              (mode === "ALL" ? "btn-primary" : "btn-outline-primary")
            }
            onClick={() => setMode("ALL")}
          >
            All
          </button>
          <button
            className={
              "btn " +
              (mode === "PASS" ? "btn-success" : "btn-outline-success")
            }
            onClick={() => setMode("PASS")}
          >
            Predicted Pass
          </button>
          <button
            className={
              "btn " +
              (mode === "FAIL" ? "btn-danger" : "btn-outline-danger")
            }
            onClick={() => setMode("FAIL")}
          >
            Predicted Fail
          </button>
        </div>
      </div>

      <table className="table table-sm align-middle">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Predicted</th>
            <th>Probability</th>
          </tr>
        </thead>
        <tbody>
          {visibleReports.map((r) => (
            <tr key={r.id}>
              <td>{r.batch_no || r.batch}</td>
              <td>
                {r.predicted_pass == null
                  ? "-"
                  : r.predicted_pass
                  ? "Pass"
                  : "Fail"}
              </td>
              <td>
                {r.predicted_probability == null
                  ? "-"
                  : r.predicted_probability.toFixed(2)}
              </td>
            </tr>
          ))}
          {visibleReports.length === 0 && (
            <tr>
              <td colSpan="3" className="text-muted">
                No QC reports match the filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default QcReportsPage;
