// src/components/Layout.jsx
import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../services/api";

function Layout({ currentPage, onChangePage, children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <nav className="navbar navbar-expand navbar-light bg-white border-bottom px-3">
        <span className="navbar-brand">MCC PDMS React</span>

        <div className="navbar-nav me-auto">
          <button
            className={
              "nav-link btn btn-link px-3" +
              (currentPage === "dashboard" ? " active fw-semibold" : "")
            }
            onClick={() => onChangePage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={
              "nav-link btn btn-link px-3" +
              (currentPage === "batches" ? " active fw-semibold" : "")
            }
            onClick={() => onChangePage("batches")}
          >
            Batches
          </button>
          <button
            className={
              "nav-link btn btn-link px-3" +
              (currentPage === "qc" ? " active fw-semibold" : "")
            }
            onClick={() => onChangePage("qc")}
          >
            QC Reports
          </button>
          <button
            className={
              "nav-link btn btn-link px-3" +
              (currentPage === "predicted" ? " active fw-semibold" : "")
            }
            onClick={() => onChangePage("predicted")}
          >
            Predicted to Pass
          </button>
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
