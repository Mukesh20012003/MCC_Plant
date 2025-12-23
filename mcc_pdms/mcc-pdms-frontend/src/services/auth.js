const API_BASE = "http://127.0.0.1:8000";

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

  // store tokens on the frontend
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);

  return data;
}
