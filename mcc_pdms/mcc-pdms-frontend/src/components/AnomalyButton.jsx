import { useState } from "react";
import { http } from "../services/http";

export function AnomalyButton({ batchId }) {
  const [state, setState] = useState({
    loading: false,
    score: null,
    isAnomaly: null,
  });

  const handleClick = async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const data = await http.post("/api/ml/detect-anomaly/", {
        batch_id: batchId,
      });
      setState({
        loading: false,
        score: data.score,
        isAnomaly: data.is_anomaly,
      });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false }));
      alert("Failed to check anomaly");
    }
  };

  let label = "Check anomaly";
  let badge = null;

  if (state.score != null) {
    const scoreText = state.score.toFixed(3);
    if (state.isAnomaly) {
      label = "Anomaly: High";
      badge = (
        <span
          className="badge bg-danger ms-2"
          title={`Score: ${scoreText}`}
        >
          High
        </span>
      );
    } else {
      label = (
        "Anomaly: Normal"
      );
      badge = (
        <span
          className="badge bg-success ms-2"
          title={`Score: ${scoreText}`}
        >
          Normal
        </span>
      );
    }
  }

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
      onClick={handleClick}
      disabled={state.loading}
    >
      {state.loading ? "Checking..." : label}
      {badge}
    </button>
  );
}
