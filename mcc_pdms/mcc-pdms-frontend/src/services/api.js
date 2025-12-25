
const API_BASE = "http://127.0.0.1:8000";

function getAccessToken() {
  return localStorage.getItem("access");
}

function authHeaders() {
  const token = getAccessToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

export async function fetchDashboardSummary() {
  const token = localStorage.getItem("access");
  const res = await fetch(`${API_BASE}/api/dashboard-summary/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function fetchBatches() {
  const res = await fetch(`${API_BASE}/api/production/batch/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load batches");
  return res.json();
}

export async function fetchQcReports() {
  const res = await fetch(`${API_BASE}/api/qc/report/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load QC reports");
  return res.json();
}

export async function fetchPredictedPassReports() {
  const res = await fetch(
    `${API_BASE}/api/qc-reports/predicted-pass/`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to load predicted reports");
  return res.json();
}

export async function fetchCurrentUser() {
  const token = localStorage.getItem("access");
  const res = await fetch(`${API_BASE}/api/me/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}


export async function fetchRagAnswer(question) {
  const token = localStorage.getItem("access");

  const res = await fetch(`${API_BASE}/api/rag/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error(`RAG request failed: ${res.status}`);
  }

  return res.json(); // { answer, sources, ... }
}


export async function ragQuery(question, batchId = null) {
  const body = batchId ? { question, batch_id: batchId } : { question };
  const res = await fetch(`${API_BASE}/api/rag/query/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("RAG query failed");
  return res.json();
}

export async function detectAnomaly(batchId) {
  const res = await fetch(`${API_BASE}/api/ml/detect-anomaly/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ batch_id: batchId }),
  });
  if (!res.ok) throw new Error("Anomaly detection failed");
  return res.json();
}
