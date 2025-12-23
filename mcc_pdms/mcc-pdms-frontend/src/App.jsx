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

import { useState, useEffect } from "react";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard"; // your React dashboard
import BatchesPage from "./components/BatchesPage";
import QcReportsPage from "./components/QcReportsPage";
import PredictedToPassPage from "./components/PredictedToPassPage";
import Layout from "./components/Layout";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsLoggedIn(!!token);
  }, []);

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  let content = null;
  if (page === "batches") content = <BatchesPage />;
  else if (page === "qc") content = <QcReportsPage />;
  else if (page === "predicted") content = <PredictedToPassPage />;
  else content = <Dashboard />;

// In App.jsx around <Layout>
return (
  <div className="min-vh-100 d-flex justify-content-center bg-light">
    <div className="w-100" style={{ maxWidth: "1200px" }}>
      <Layout currentPage={page} onChangePage={setPage}>
        {content}
      </Layout>
    </div>
  </div>
);

}

export default App;
