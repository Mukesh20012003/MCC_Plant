// src/components/BatchesTable.jsx
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function BatchesTable() {
  const [batches, setBatches] = useState([]);
  const [anomalyMap, setAnomalyMap] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("access");

    fetch(`${API_BASE}/api/batches/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => res.json())
      .then((data) => setBatches(Array.isArray(data) ? data : data.results || []))
      .catch((err) => console.error(err));
  }, []);

  async function handleCheckAnomaly(batchId) {
    const token = localStorage.getItem("access");

    try {
      const res = await fetch(`${API_BASE}/api/ml/detect-anomaly/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ batch_id: batchId }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json(); // { is_anomaly, anomaly_score }
      setAnomalyMap((prev) => ({
        ...prev,
        [batchId]: { is_anomaly: data.is_anomaly, score: data.anomaly_score },
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to check anomaly");
    }
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Batch</th>
          <th>Status</th>
          <th>Anomaly</th>
        </tr>
      </thead>
      <tbody>
        {batches.map((b) => (
          <tr key={b.id}>
            <td>{b.batch_no}</td>
            <td>{b.status}</td>
            <td>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleCheckAnomaly(b.id)}
              >
                Check
              </button>
              {anomalyMap[b.id] && (
                <span
                  className={
                    "badge ms-2 " +
                    (anomalyMap[b.id].is_anomaly ? "bg-danger" : "bg-success")
                  }
                  title={`Score: ${anomalyMap[b.id].score.toFixed(3)}`}
                >
                  {anomalyMap[b.id].is_anomaly ? "High" : "Normal"}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BatchesTable;
