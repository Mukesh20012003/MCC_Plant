async function fetchJSON(url) {
  const resp = await fetch(url, {
    headers: { "Accept": "application/json" },
    credentials: "same-origin",
  });
  return resp.json();
}

function formatProbability(p) {
  if (p === null || p === undefined) return "-";
  return (p * 100).toFixed(1) + "%";
}

async function loadBatches() {
  try {
    const batches = await fetchJSON("/api/production/batch/");
    const tbody = document.querySelector("#batches-table tbody");
    tbody.innerHTML = "";

    batches.forEach((b) => {
      const qc = b.latest_qc;
      const tr = document.createElement("tr");

      const predictedText =
        qc && qc.predicted_pass !== null
          ? (qc.predicted_pass ? "Pass" : "Fail")
          : "-";

      const actualText =
        qc && qc.passed !== null
          ? (qc.passed ? "Pass" : "Fail")
          : "-";

      tr.innerHTML = `
        <td>${b.batch_no}</td>
        <td>${b.raw_material_detail ? b.raw_material_detail.name : "N/A"}</td>
        <td>${b.status}</td>
        <td>${predictedText}</td>
        <td>${qc ? formatProbability(qc.predicted_probability) : "-"}</td>
        <td>${actualText}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load batches:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadBatches);
