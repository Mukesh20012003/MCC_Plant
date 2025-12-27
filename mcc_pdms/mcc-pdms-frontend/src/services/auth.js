// src/auth.js
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  const data = await res.json();

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);

  return data;
}

export function getAccessToken() {
  return localStorage.getItem("access");
}

export function isLoggedIn() {
  return !!getAccessToken();
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function forceLogout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  // reload to let App.jsx see isLoggedIn = false
  window.location.href = "/login";
}

