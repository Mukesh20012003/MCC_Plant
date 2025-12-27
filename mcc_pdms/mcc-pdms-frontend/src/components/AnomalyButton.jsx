// src/components/AnomalyButton.jsx
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
      const data = await http.post("/api/ml/detect-anomaly/", { batch_id: batchId });
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
          className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"
          title={`Score: ${scoreText}`}
        >
          High
        </span>
      );
    } else {
      label = "Anomaly: Normal";
      badge = (
        <span
          className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800"
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
      onClick={handleClick}
      disabled={state.loading}
      className="inline-flex items-center px-3 py-1 border border-red-400 text-red-500 text-xs rounded-md hover:bg-red-50 disabled:opacity-50"
    >
      {state.loading ? "Checking..." : label}
      {badge}
    </button>
  );
}
