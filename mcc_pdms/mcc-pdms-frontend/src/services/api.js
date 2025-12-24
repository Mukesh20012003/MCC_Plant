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
  const res = await fetch(`${API_BASE}/api/dashboard-summary/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
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
  const res = await fetch(`${API_BASE}/api/me/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}

export async function fetchRagAnswer(question) {
  const res = await fetch(`${API_BASE}/api/rag-chat/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to get RAG answer");
  return res.json();
}
