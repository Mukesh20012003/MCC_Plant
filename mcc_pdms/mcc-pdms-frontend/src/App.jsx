// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import BatchesPage from "./components/BatchesPage";
import QcReportsPage from "./components/QcReportsPage";
import PredictedToPassPage from "./components/PredictedToPassPage";
import Layout from "./components/Layout";
import RagChatWidget from "./components/RagChatWidget";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // check token on first load
  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsLoggedIn(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // clear tokens and update state
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-6xl flex flex-col relative">
        {/* Pass onLogout so Layout can render a Logout button like Flipkart header */}
        <Layout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/qc" element={<QcReportsPage />} />
            <Route path="/predicted" element={<PredictedToPassPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <RagChatWidget />
      </div>
    </div>
  );
}

export default App;
