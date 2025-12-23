// src/components/Layout.jsx
import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../services/api";

function Layout({ currentPage, onChangePage, children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => {});
  }, []);

  return (
    <>
      <nav className="navbar navbar-light bg-light px-3 mb-3">
        <span className="navbar-brand">MCC PDMS React</span>
        <div className="d-flex align-items-center gap-3">
          {user && (
            <span className="text-muted small">
              {user.username} | Role: {user.role}
            </span>
          )}
          <button
            className="btn btn-link"
            onClick={() => onChangePage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className="btn btn-link"
            onClick={() => onChangePage("batches")}
          >
            Batches
          </button>
          <button
            className="btn btn-link"
            onClick={() => onChangePage("qc")}
          >
            QC Reports
          </button>
          <button
            className="btn btn-link"
            onClick={() => onChangePage("predicted")}
          >
            Predicted to Pass
          </button>
        </div>
      </nav>
      {children}
    </>
  );
}

export default Layout;
