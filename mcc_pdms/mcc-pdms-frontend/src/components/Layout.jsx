// src/components/Layout.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "../services/api";

function Layout({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      // no token -> send to login
      navigate("/login", { replace: true });
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        // token invalid/expired -> clear and go to login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <nav className="navbar navbar-expand navbar-light bg-white border-bottom px-3">
        <span className="navbar-brand">MCC PDMS React</span>

        <div className="navbar-nav me-auto">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "nav-link px-3" + (isActive ? " active fw-semibold" : "")
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/batches"
            className={({ isActive }) =>
              "nav-link px-3" + (isActive ? " active fw-semibold" : "")
            }
          >
            Batches
          </NavLink>
          <NavLink
            to="/qc"
            className={({ isActive }) =>
              "nav-link px-3" + (isActive ? " active fw-semibold" : "")
            }
          >
            QC Reports
          </NavLink>
          <NavLink
            to="/predicted"
            className={({ isActive }) =>
              "nav-link px-3" + (isActive ? " active fw-semibold" : "")
            }
          >
            Predicted to Pass
          </NavLink>
        </div>

        {user && (
          <span className="navbar-text small text-muted">
            {user.username} | Role: {user.role}
          </span>
        )}
      </nav>

      <main className="flex-grow-1 bg-white">
        <div className="container py-3">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
