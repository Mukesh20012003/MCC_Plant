// import BatchesTable from "./components/BatchesTable";

// import PredictedToPassTable from "./components/PredictedToPassTable";

// function App() {
//   return (
//     <div className="container">
//       <h1>MCC PDMS React Dashboard</h1>
//       <h2>Predicted to Pass (ML)</h2>
//       <BatchesTable />
//       <PredictedToPassTable />
//     </div>
//   );
// }


// export default App;

// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import BatchesPage from "./components/BatchesPage";
import QcReportsPage from "./components/QcReportsPage";
import PredictedToPassPage from "./components/PredictedToPassPage";
import Layout from "./components/Layout";
import RagChatWidget from "./components/RagChatWidget"; // or RagChat page

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check token once on load
  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsLoggedIn(!!token);
  }, []);

  // Guarded app shell
  if (!isLoggedIn) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <LoginForm
          onLoginSuccess={() => {
            setIsLoggedIn(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex justify-content-center bg-light">
      <div className="w-100" style={{ maxWidth: "1200px" }}>
        {/* Layout shows sidebar/topbar and contains page content via routes */}
        <Layout>
          <Routes>
            {/* Default dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Other pages */}
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/qc" element={<QcReportsPage />} />
            <Route path="/predicted" element={<PredictedToPassPage />} />

            {/* RAG page, if you want full page */}
            {/* <Route path="/rag" element={<RagChatPage />} /> */}

            {/* Fallback: unknown paths -> dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>

        {/* RAG widget floating on every page */}
        <RagChatWidget />
      </div>
    </div>
  );
}

export default App;

