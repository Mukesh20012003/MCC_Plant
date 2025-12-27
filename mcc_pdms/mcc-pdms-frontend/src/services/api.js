// src/services/api.js
import { http } from "./http";


// Dashboard summary
export function fetchDashboardSummary() {
  return http.get("/api/dashboard-summary/");
}

// Batches
export function fetchBatches() {
  return http.get("/api/production/batch/");
}

// QC reports
export function fetchQcReports() {
  return http.get("/api/qc/report/");
}

// Predicted-to-pass reports
export function fetchPredictedPassReports() {
  return http.get("/api/qc-reports/predicted-pass/");
}

// Current user
export function fetchCurrentUser() {
  return http.get("/api/me/");
}

// RAG answer (simple)
export function fetchRagAnswer(question) {
  return http.post("/api/rag/query/", { question });
}

// RAG with optional batch context
export function ragQuery(question, batchId = null) {
  const body = batchId ? { question, batch_id: batchId } : { question };
  return http.post("/api/rag/query/", body);
}

// Anomaly detection
export function detectAnomaly(batchId) {
  return http.post("/api/ml/detect-anomaly/", { batch_id: batchId });
}
