// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { fetchDashboardSummary, detectAnomaly } from "../services/api";
import HelpCard from "./HelpCard";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [localAnomalies, setLocalAnomalies] = useState({});
  const [activeRole, setActiveRole] = useState("OPERATOR");

  // drill‑down, alerts, time range, micro‑interactions
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [timeRange, setTimeRange] = useState("SHIFT"); // LAST_8H | SHIFT | DAY
  const [alertMessages, setAlertMessages] = useState([]);
  const [isCheckingAnomaly, setIsCheckingAnomaly] = useState(null);

  // load dashboard summary
  useEffect(() => {
    const load = () => {
      fetchDashboardSummary()
        .then((data) => {
          setSummary(data);
          setLastUpdated(new Date());
          setError("");
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || "Failed to load dashboard");
        });
    };

    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  // KPI helper (plain function)
  const computeKpis = (s) => {
    if (!s) {
      return {
        oee: null,
        fpy: null,
        downtimePct: null,
        unitsPerHour: null,
        scrapRate: null,
      };
    }

    const good = s.good_units ?? 0;
    const total = s.total_units ?? 0;
    const scrap = s.scrap_units ?? 0;

    const idealCycle = s.ideal_cycle_time_sec ?? 0;
    const plannedMin = s.planned_minutes ?? 0;
    const downtimeMin = s.downtime_minutes ?? 0;

    const plannedTime = plannedMin * 60;
    const downtime = downtimeMin * 60;
    const runTime = Math.max(plannedTime - downtime, 0);

    const quality = total > 0 ? good / total : 0;
    const availability =
      plannedTime > 0 && runTime > 0 ? runTime / plannedTime : 0;
    const performance =
      runTime > 0 && idealCycle > 0 ? (idealCycle * total) / runTime : 0;

    const oee = availability * performance * quality * 100;
    const fpy = total > 0 ? (good / total) * 100 : 0;
    const scrapRate = total > 0 ? (scrap / total) * 100 : 0;
    const downtimePct =
      plannedTime > 0 ? (downtime / plannedTime) * 100 : 0;
    const runHours = runTime / 3600;
    const unitsPerHour = runHours > 0 ? total / runHours : 0;

    return { oee, fpy, downtimePct, unitsPerHour, scrapRate };
  };

  const handleCheckAnomaly = async (batchId) => {
    try {
      setIsCheckingAnomaly(batchId);
      const res = await detectAnomaly(batchId);
      setLocalAnomalies((prev) => ({
        ...prev,
        [batchId]: { is_anomaly: res.is_anomaly, score: res.score },
      }));
      setTimeout(() => setIsCheckingAnomaly(null), 400);
    } catch (err) {
      console.error(err);
      setIsCheckingAnomaly(null);
      alert("Failed to check anomaly");
    }
  };

  // compute KPIs once per render
  const { oee, fpy, downtimePct, unitsPerHour, scrapRate } = computeKpis(
    summary
  );

  // alerts based on KPIs
  useEffect(() => {
    if (!summary) {
      setAlertMessages([]);
      return;
    }

    const alerts = [];

    if (downtimePct != null && downtimePct > 20) {
      alerts.push(
        `Downtime above 20% for selected period (${downtimePct.toFixed(1)}%).`
      );
    }
    if (scrapRate != null && scrapRate > 5) {
      alerts.push(`Scrap rate above 5% (${scrapRate.toFixed(2)}%).`);
    }

    const totalQc = summary.total_qc_reports ?? 0;
    const predictedFail =
      (summary.total_batches ?? 0) - (summary.predicted_to_pass ?? 0);
    if (totalQc > 0) {
      const failRate =
        (predictedFail / (summary.total_batches || 1)) * 100;
      if (failRate > 10) {
        alerts.push(
          `Predicted fail rate above 10% (${failRate.toFixed(1)}%).`
        );
      }
    }

    setAlertMessages(alerts);
  }, [summary, downtimePct, scrapRate]);

  if (error && !summary) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-2">
            Failed to load dashboard.
          </p>
          <p className="text-xs text-gray-500 mb-3">{error}</p>
          <button
            className="px-3 py-1 text-xs rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary && !error) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading dashboard data…</p>
        </div>
      </div>
    );
  }

  const {
    total_batches,
    total_qc_reports,
    predicted_to_pass,
    recent_batches,
    stoppages = [],
    current_shift_name,
    current_shift_start,
    current_shift_end,
    line_status,
    shift_utilization,
    active_alarms_count,
    operator_next_action,
    oee_last_shift,
    scrap_rate_last_shift,
    defect_rate_last_shift,
    throughput_last_shift,
    oee_trend = [],
    scrap_trend = [],
    defect_trend = [],
  } = summary;

  const filteredRecent = recent_batches.filter((b) => {
    const effectiveAnomaly =
      localAnomalies[b.id]?.is_anomaly ?? b.is_anomaly ?? null;
    if (batchFilter === "ALL") return true;
    if (batchFilter === "ANOMALY") return effectiveAnomaly === true;
    if (batchFilter === "PRED_FAIL") return b.predicted === false;
    if (batchFilter === "PRED_PASS") return b.predicted === true;
    return true;
  });

  return (
    <div className="py-4">
      {/* header with alerts, time range, role toggle */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
        <h1 className="text-xl font-semibold">PRIMARY CRUSHER</h1>
        <div className="flex flex-col items-end gap-2">
          {alertMessages.length > 0 && (
            <div className="w-full bg-red-50 border border-red-200 text-red-800 text-xs px-3 py-1 rounded-md flex flex-wrap gap-2 justify-end">
              {alertMessages.map((msg, idx) => (
                <span key={idx} className="inline-flex items-center gap-1">
                  ● {msg}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* time range selector (UI only for now) */}
            <div className="bg-gray-100 rounded-full p-1 text-[10px]">
              {[
                { id: "LAST_8H", label: "Last 8h" },
                { id: "SHIFT", label: "This shift" },
                { id: "DAY", label: "Today" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTimeRange(opt.id)}
                  className={`px-2 py-1 rounded-full ${
                    timeRange === opt.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="bg-gray-100 rounded-full p-1 text-xs">
              {["OPERATOR", "ENGINEER"].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-3 py-1 rounded-full ${
                    activeRole === role
                      ? "bg-blue-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  {role === "OPERATOR" ? "Operator view" : "Engineer view"}
                </button>
              ))}
            </div>

            {lastUpdated && (
              <small className="text-xs text-gray-500">
                Last updated {lastUpdated.toLocaleTimeString()}
              </small>
            )}
          </div>
        </div>
      </div>

      {/* common KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">Total Batches</h6>
          <p className="text-3xl font-semibold">{total_batches}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">Predicted to Pass</h6>
          <p className="text-3xl font-semibold text-green-600">
            {predicted_to_pass}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">QC Reports</h6>
          <p className="text-3xl font-semibold">{total_qc_reports}</p>
        </div>
      </div>

      {/* Manufacturing KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">OEE (calculated)</h6>
          <p className="text-2xl font-semibold">
            {oee != null ? oee.toFixed(1) : "--"}%
          </p>
          <p className="text-[10px] text-gray-500">
            Availability × Performance × Quality
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">Scrap rate</h6>
          <p className="text-2xl font-semibold text-red-600">
            {scrapRate != null ? scrapRate.toFixed(2) : "--"}%
          </p>
          <p className="text-[10px] text-gray-500">
            Scrap units ÷ total units
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">First-pass yield</h6>
          <p className="text-2xl font-semibold text-green-600">
            {fpy != null ? fpy.toFixed(2) : "--"}%
          </p>
          <p className="text-[10px] text-gray-500">
            Good units ÷ total units
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">Downtime %</h6>
          <p className="text-2xl font-semibold text-amber-600">
            {downtimePct != null ? downtimePct.toFixed(2) : "--"}%
          </p>
          <p className="text-[10px] text-gray-500">
            Downtime ÷ planned time
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h6 className="text-sm text-gray-600">Units per hour</h6>
          <p className="text-2xl font-semibold">
            {unitsPerHour != null ? unitsPerHour.toFixed(1) : "--"}
          </p>
          <p className="text-[10px] text-gray-500">
            Total units ÷ run hours
          </p>
        </div>
      </div>

      {/* OPERATOR VIEW */}
      {activeRole === "OPERATOR" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">Current shift</h6>
              <p className="text-xl font-semibold">
                {current_shift_name || "A"}
              </p>
              <p className="text-[11px] text-gray-500">
                {current_shift_start} - {current_shift_end}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">Line status</h6>
              <p
                className={`text-xl font-semibold ${
                  line_status === "RUNNING"
                    ? "text-green-600"
                    : line_status === "STOPPED"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {line_status || "UNKNOWN"}
              </p>
              <p className="text-[11px] text-gray-500">
                Utilization this shift: {shift_utilization ?? 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">Alarms</h6>
              <p className="text-xl font-semibold text-red-600">
                {active_alarms_count ?? 0}
              </p>
              <p className="text-[11px] text-gray-500">
                {active_alarms_count ? "Check alarm panel" : "No active alarms"}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">Next action</h6>
              <p className="text-[12px] text-gray-800">
                {operator_next_action ||
                  "Monitor current batch and respond to new alarms."}
              </p>
            </div>
          </div>

          <DashboardCharts recent_batches={recent_batches} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-md font-semibold">Recent Batches</h5>
                <div className="flex gap-2 text-[10px]">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "PRED_FAIL", label: "Pred. Fail" },
                    { id: "PRED_PASS", label: "Pred. Pass" },
                    { id: "ANOMALY", label: "Anomaly" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setBatchFilter(f.id)}
                      className={`px-2 py-1 rounded-full border transition ${
                        batchFilter === f.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Batch ID
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Predicted
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Probability
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Anomaly
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecent.map((b) => {
                      const anomaly =
                        localAnomalies[b.id] ??
                        (b.is_anomaly != null
                          ? {
                              is_anomaly: b.is_anomaly,
                              score: b.anomaly_score,
                            }
                          : null);

                      const created = b.created_at || b.end_time || null;
                      const createdDisplay = created
                        ? new Date(created).toLocaleString()
                        : "-";

                      return (
                        <tr
                          key={b.id}
                          className={`cursor-pointer transition-colors ${
                            isCheckingAnomaly === b.id
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            setSelectedBatch(b);
                            setShowDetail(true);
                          }}
                        >
                          <td className="px-3 py-2" title={createdDisplay}>
                            {b.batch_no}
                          </td>
                          <td className="px-3 py-2">{b.status}</td>
                          <td className="px-3 py-2">
                            {b.predicted == null
                              ? "-"
                              : b.predicted
                              ? "Pass"
                              : "Fail"}
                          </td>
                          <td
                            className="px-3 py-2"
                            title={
                              b.probability != null
                                ? `Updated at ${createdDisplay}`
                                : ""
                            }
                          >
                            {b.probability == null
                              ? "-"
                              : b.probability.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            {anomaly == null ? (
                              <span className="text-gray-400 text-xs">
                                Not checked
                              </span>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  anomaly.is_anomaly
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                                title={
                                  anomaly.score != null
                                    ? `Anomaly score: ${anomaly.score.toFixed(
                                        3
                                      )}`
                                    : "Anomaly score not available"
                                }
                              >
                                {anomaly.is_anomaly ? "High" : "Normal"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckAnomaly(b.id);
                              }}
                              disabled={isCheckingAnomaly === b.id}
                              className="px-2 py-1 border border-blue-500 text-blue-600 rounded-md text-[10px] hover:bg-blue-50 disabled:opacity-50"
                            >
                              {isCheckingAnomaly === b.id
                                ? "Checking..."
                                : "Check anomaly"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredRecent.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-3 py-3 text-center text-gray-500 text-xs"
                        >
                          No recent batches match the selected filter. Once new
                          batches are created and QC reports are recorded, they
                          will appear here with predicted quality and anomaly
                          status.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <StoppagesChart stoppages={stoppages} />
          </div>
        </>
      )}

      {/* ENGINEER / MANAGER VIEW */}
      {activeRole === "ENGINEER" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">OEE (last shift)</h6>
              <p className="text-3xl font-semibold">
                {oee_last_shift != null ? oee_last_shift.toFixed(1) : "--"}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">Scrap rate</h6>
              <p className="text-3xl font-semibold text-red-600">
                {scrap_rate_last_shift != null
                  ? scrap_rate_last_shift.toFixed(2)
                  : "--"}
                %
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">Defect rate</h6>
              <p className="text-3xl font-semibold text-amber-600">
                {defect_rate_last_shift != null
                  ? defect_rate_last_shift.toFixed(2)
                  : "--"}
                %
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm text-gray-600">Throughput</h6>
              <p className="text-3xl font-semibold">
                {throughput_last_shift ?? "--"}
              </p>
              <p className="text-[11px] text-gray-500">Units / shift</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm font-semibold mb-3">OEE by shift</h6>
              <Line
                data={{
                  labels: oee_trend.map(
                    (p) => `${p.date} (Shift ${p.shift})`
                  ),
                  datasets: [
                    {
                      label: "OEE %",
                      data: oee_trend.map((p) => p.oee),
                      borderColor: "#16a34a",
                      backgroundColor: "rgba(22,163,74,0.15)",
                      tension: 0.3,
                    },
                  ],
                }}
              />
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h6 className="text-sm font-semibold mb-3">
                Scrap & defects by shift
              </h6>
              <Line
                data={{
                  labels: scrap_trend.map(
                    (p) => `${p.date} (Shift ${p.shift})`
                  ),
                  datasets: [
                    {
                      label: "Scrap rate %",
                      data: scrap_trend.map((p) => p.scrap_rate),
                      borderColor: "#ef4444",
                      backgroundColor: "rgba(239,68,68,0.1)",
                      tension: 0.3,
                    },
                    {
                      label: "Defect rate %",
                      data: defect_trend.map((p) => p.defect_rate),
                      borderColor: "#f97316",
                      backgroundColor: "rgba(249,115,22,0.1)",
                      tension: 0.3,
                    },
                  ],
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-md font-semibold">Recent Batches</h5>
                <div className="flex gap-2 text-[10px]">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "PRED_FAIL", label: "Pred. Fail" },
                    { id: "PRED_PASS", label: "Pred. Pass" },
                    { id: "ANOMALY", label: "Anomaly" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setBatchFilter(f.id)}
                      className={`px-2 py-1 rounded-full border transition ${
                        batchFilter === f.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Batch ID
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Predicted
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Probability
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Anomaly
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecent.map((b) => {
                      const anomaly =
                        localAnomalies[b.id] ??
                        (b.is_anomaly != null
                          ? {
                              is_anomaly: b.is_anomaly,
                              score: b.anomaly_score,
                            }
                          : null);

                      const created = b.created_at || b.end_time || null;
                      const createdDisplay = created
                        ? new Date(created).toLocaleString()
                        : "-";

                      return (
                        <tr
                          key={b.id}
                          className={`cursor-pointer transition-colors ${
                            isCheckingAnomaly === b.id
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            setSelectedBatch(b);
                            setShowDetail(true);
                          }}
                        >
                          <td className="px-3 py-2" title={createdDisplay}>
                            {b.batch_no}
                          </td>
                          <td className="px-3 py-2">{b.status}</td>
                          <td className="px-3 py-2">
                            {b.predicted == null
                              ? "-"
                              : b.predicted
                              ? "Pass"
                              : "Fail"}
                          </td>
                          <td
                            className="px-3 py-2"
                            title={
                              b.probability != null
                                ? `Updated at ${createdDisplay}`
                                : ""
                            }
                          >
                            {b.probability == null
                              ? "-"
                              : b.probability.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            {anomaly == null ? (
                              <span className="text-gray-400 text-xs">
                                Not checked
                              </span>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  anomaly.is_anomaly
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                                title={
                                  anomaly.score != null
                                    ? `Anomaly score: ${anomaly.score.toFixed(
                                        3
                                      )}`
                                    : "Anomaly score not available"
                                }
                              >
                                {anomaly.is_anomaly ? "High" : "Normal"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckAnomaly(b.id);
                              }}
                              disabled={isCheckingAnomaly === b.id}
                              className="px-2 py-1 border border-blue-500 text-blue-600 rounded-md text-[10px] hover:bg-blue-50 disabled:opacity-50"
                            >
                              {isCheckingAnomaly === b.id
                                ? "Checking..."
                                : "Check anomaly"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredRecent.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-3 py-3 text-center text-gray-500 text-xs"
                        >
                          No recent batches match the selected filter. Once new
                          batches are created and QC reports are recorded, they
                          will appear here with predicted quality and anomaly
                          status.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <StoppagesChart stoppages={stoppages} />
          </div>
        </>
      )}

      {/* Drill‑down side panel */}
      {showDetail && selectedBatch && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                Batch {selectedBatch.batch_no} details
              </h4>
              <button
                onClick={() => setShowDetail(false)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <div className="px-4 py-3 text-xs space-y-3 overflow-y-auto">
              <div>
                <h5 className="font-semibold mb-1">Status & prediction</h5>
                <p>Status: {selectedBatch.status}</p>
                <p>
                  Predicted:{" "}
                  {selectedBatch.predicted == null
                    ? "Not available"
                    : selectedBatch.predicted
                    ? "Pass"
                    : "Fail"}
                </p>
                <p>
                  Probability:{" "}
                  {selectedBatch.probability == null
                    ? "-"
                    : selectedBatch.probability.toFixed(3)}
                </p>
              </div>

              <div>
                <h5 className="font-semibold mb-1">Anomaly insight</h5>
                <p>
                  Anomaly status:{" "}
                  {localAnomalies[selectedBatch.id]?.is_anomaly ??
                  selectedBatch.is_anomaly ??
                  null
                    ? "High"
                    : "Normal / not checked"}
                </p>
                <p>
                  Anomaly score:{" "}
                  {localAnomalies[selectedBatch.id]?.score ??
                    selectedBatch.anomaly_score ??
                    "N/A"}
                </p>
                <p className="text-gray-500 mt-1">
                  Use this panel to explain which sensors or features contributed
                  to the anomaly in future iterations.
                </p>
              </div>

              <div>
                <h5 className="font-semibold mb-1">QC details</h5>
                {selectedBatch.latest_qc ? (
                  <div className="space-y-1">
                    <p>
                      Moisture:{" "}
                      {selectedBatch.latest_qc.moisture_actual != null
                        ? `${selectedBatch.latest_qc.moisture_actual.toFixed(
                            2
                          )} %`
                        : "N/A"}
                    </p>
                    <p>
                      Particle size:{" "}
                      {selectedBatch.latest_qc.particle_size_actual != null
                        ? `${selectedBatch.latest_qc.particle_size_actual.toFixed(
                            2
                          )} µm`
                        : "N/A"}
                    </p>
                    <p>
                      QC result:{" "}
                      {selectedBatch.latest_qc.passed == null
                        ? "Pending"
                        : selectedBatch.latest_qc.passed
                        ? "Pass"
                        : "Fail"}
                    </p>
                    <p className="text-gray-500">
                      Last QC at{" "}
                      {new Date(
                        selectedBatch.latest_qc.created_at
                      ).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No QC report recorded yet for this batch.
                  </p>
                )}
              </div>

              <div>
                <h5 className="font-semibold mb-1">Navigation</h5>
                <a
                  href={`/batches/${selectedBatch.id}`}
                  className="text-blue-600 underline"
                >
                  Open full batch page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <HelpCard />
    </div>
  );
}

// charts components (unchanged)
function DashboardCharts({ recent_batches }) {
  const lineData = {
    labels: recent_batches.map((b) => b.batch_no),
    datasets: [
      {
        label: "Predicted probability",
        data: recent_batches.map((b) => b.probability || 0),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.3,
      },
    ],
  };

  const availability = 82;
  const availabilityData = {
    labels: ["Available", "Unavailable"],
    datasets: [
      {
        data: [availability, 100 - availability],
        backgroundColor: ["#16a34a", "#e5e7eb"],
        borderWidth: 0,
      },
    ],
  };

  const availabilityOptions = {
    cutout: "80%",
    plugins: { legend: { display: false } },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
        <h6 className="text-sm font-semibold mb-3">
          Hourly Quality Probability
        </h6>
        <Line data={lineData} />
      </div>
      <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center p-4">
        <h6 className="text-sm font-semibold mb-2">Availability Factor</h6>
        <div className="w-40">
          <Doughnut data={availabilityData} options={availabilityOptions} />
        </div>
        <p className="mt-2 text-2xl font-semibold">
          {availability.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

function StoppagesChart({ stoppages }) {
  const labels = stoppages.map((s) => s.reason);
  const values = stoppages.map((s) => s.minutes);

  const data = {
    labels,
    datasets: [
      {
        label: "Minutes stopped",
        data: values,
        backgroundColor: "rgba(239, 68, 68, 0.85)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Minutes" },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <h5 className="text-md font-semibold mb-2">Plant Stoppages</h5>
      {stoppages.length ? (
        <Bar data={data} options={options} />
      ) : (
        <p className="text-xs text-gray-500 mt-4">
          No stoppage data available for this period. Once stoppage records are
          logged in the PDMS, they will appear here.
        </p>
      )}
    </div>
  );
}

export default Dashboard;
