// src/components/HelpCard.jsx
function HelpCard() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h5 className="text-lg font-semibold mb-2">Help / About</h5>
      <p className="mb-1 text-xs text-gray-700">
        <strong>Anomaly badge</strong>: On the Batches page, click “Check” in the Anomaly column
        to run anomaly detection on a batch. A red “High” badge means the batch behaves
        unusually and may need review; a green “Normal” badge means the batch is within typical
        behavior.
      </p>
      <p className="mb-1 text-xs text-gray-700">
        <strong>RAG assistant</strong>: Use the chat widget in the bottom-right corner to ask
        about MCC process steps, SOPs, QC tests, troubleshooting and alarms. Answers are based on
        internal MCC plant documents indexed by the system.
      </p>
      <p className="mb-0 text-xs text-gray-500">
        Configuration changes (models, thresholds, RAG documents) should be performed by the
        system maintainer.
      </p>
    </div>
  );
}

export default HelpCard;
