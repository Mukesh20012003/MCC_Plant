// src/services/http.js
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function authHeader() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...authHeader(),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.detail || data.error || JSON.stringify(data);
    } catch {
      // ignore parse error
    }

    if (res.status === 401) {
      // auto logout on 401
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      // optional hard redirect so App resets immediately
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }

    throw new Error(detail || `Request failed with status ${res.status}`);
  }

  // Assume JSON for all your APIs
  return res.json();
}

export const http = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
};
