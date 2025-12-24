// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import { fetchDashboardSummary } from "../services/api";

function DashboardCharts({ recent_batches }) {
  const lineData = {
    labels: recent_batches.map((b) => b.batch_no),
    datasets: [
      {
        label: "Predicted probability",
        data: recent_batches.map((b) => b.probability || 0),
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13,110,253,0.2)",
        tension: 0.3,
      },
    ],
  };

  const availability = 82; // later compute from data
  const availabilityData = {
    labels: ["Available", "Unavailable"],
    datasets: [
      {
        data: [availability, 100 - availability],
        backgroundColor: ["#198754", "#e9ecef"],
        borderWidth: 0,
      },
    ],
  };

  const availabilityOptions = {
    cutout: "80%",
    plugins: { legend: { display: false } },
  };

  return (
    <div className="row g-3 mb-4">
      <div className="col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <h6 className="card-title mb-3">Hourly Quality Probability</h6>
            <Line data={lineData} />
          </div>
        </div>
      </div>

      <div className="col-lg-3">
        <div className="card shadow-sm h-100 d-flex align-items-center justify-content-center">
          <div className="card-body text-center">
            <h6 className="card-title mb-2">Availability Factor</h6>
            <div style={{ maxWidth: 160, margin: "0 auto" }}>
              <Doughnut
                data={availabilityData}
                options={availabilityOptions}
              />
            </div>
            <p className="mt-2 h4 mb-0">{availability.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* placeholder for another chart card */}
      <div className="col-lg-3">
        <div className="card shadow-sm h-100 d-flex align-items-center justify-content-center">
          <div className="card-body text-center">
            <h6 className="card-title mb-2">Another Metric</h6>
            <p className="text-muted mb-0">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const load = () => {
      fetchDashboardSummary()
        .then((data) => {
          setSummary(data);
          setLastUpdated(new Date());
        })
        .catch((err) => setError(err.message));
    };

    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  if (error) return <p className="text-center text-danger mt-5">{error}</p>;
  if (!summary) return <p className="text-center mt-5">Loading...</p>;

  const {
    total_batches,
    total_qc_reports,
    predicted_to_pass,
    recent_batches,
  } = summary;

  return (
     <div className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">PRIMARY CRUSHER</h1>
        {lastUpdated && (
          <small className="text-muted">
            Last updated {lastUpdated.toLocaleTimeString()}
          </small>
        )}
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Total Batches</h6>
              <p className="display-6 mb-0">{total_batches}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Predicted to Pass</h6>
              <p className="display-6 mb-0 text-success">
                {predicted_to_pass}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">QC Reports</h6>
              <p className="display-6 mb-0">{total_qc_reports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* charts row */}
      <DashboardCharts recent_batches={recent_batches} />

      {/* bottom row: table + placeholder chart */}
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Recent Batches</h5>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Status</th>
                      <th>Predicted</th>
                      <th>Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_batches.map((b) => (
                      <tr key={b.id}>
                        <td>{b.batch_no}</td>
                        <td>{b.status}</td>
                        <td>
                          {b.predicted == null
                            ? "-"
                            : b.predicted
                            ? "Pass"
                            : "Fail"}
                        </td>
                        <td>
                          {b.probability == null
                            ? "-"
                            : b.probability.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {recent_batches.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-muted">
                          No recent batches.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm h-100 d-flex align-items-center justify-content-center">
            <div className="card-body text-center">
              <h5 className="card-title mb-2">Plant Stoppages</h5>
              <p className="text-muted mb-0">Bar chart coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
