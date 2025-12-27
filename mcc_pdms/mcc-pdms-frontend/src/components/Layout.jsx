// src/components/Layout.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "../services/api";

function Layout({ children, onLogout }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm rounded-md transition ${
      isActive ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <nav className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-blue-600">MCC PDMS React</span>
          <div className="flex gap-1">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/batches" className={linkClass}>
              Batches
            </NavLink>
            <NavLink to="/qc" className={linkClass}>
              QC Reports
            </NavLink>
            <NavLink to="/predicted" className={linkClass}>
              Predicted to Pass
            </NavLink>
          </div>
        </div>
        {user && (
          <span className="text-xs text-gray-500">
            {user.username} | Role: {user.role}
          </span>
        )}
        {/* Right side: user info + Logout button (Flipkart-style) */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-gray-500">
              {user.username} | Role: {user.role}
            </span>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
