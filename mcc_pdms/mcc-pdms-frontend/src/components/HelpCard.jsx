// src/components/HelpCard.jsx

function HelpCard() {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-2">Help / About</h5>
        <p className="mb-1 small">
          <strong>Anomaly badge</strong>: On the Batches page, click “Check” in
          the Anomaly column to run anomaly detection on a batch. A red “High”
          badge means the batch behaves unusually and may need review; a green
          “Normal” badge means the batch is within typical behavior.
        </p>
        <p className="mb-1 small">
          <strong>RAG assistant</strong>: Use the chat widget in the
          bottom-right corner to ask about MCC process steps, SOPs, QC tests,
          troubleshooting and alarms. Answers are based on internal MCC plant
          documents indexed by the system.
        </p>
        <p className="mb-0 small text-muted">
          Configuration changes (models, thresholds, RAG documents) should be
          performed by the system maintainer.
        </p>
      </div>
    </div>
  );
}

export default HelpCard;
