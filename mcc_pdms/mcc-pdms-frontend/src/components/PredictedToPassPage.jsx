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

  if (loading) return <p className="text-center mt-5">Loading...</p>;
  if (error) return <p className="text-center text-danger mt-5">{error}</p>;

  return (
    <div className="py-4">
      <h1 className="h3 mb-4">Predicted to Pass (ML)</h1>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Probability</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={r.predicted_probability >= 0.9 ? "table-success" : ""}
                  >
                    <td>{r.batch_no}</td>
                    <td>
                      {r.predicted_probability == null
                        ? "-"
                        : r.predicted_probability.toFixed(2)}
                    </td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-muted">
                      No predicted-pass reports yet.
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

export default PredictedToPassPage;
