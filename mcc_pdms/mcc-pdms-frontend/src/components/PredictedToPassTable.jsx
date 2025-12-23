import { useEffect, useState } from "react";
import { fetchPredictedPassReports } from "../services/api";

function PredictedToPassTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPredictedPassReports()
      .then(setRows)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Batch</th>
          <th>Probability</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.batch_no}</td>
            <td>{r.predicted_probability?.toFixed(2)}</td>
            <td>{new Date(r.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PredictedToPassTable;
