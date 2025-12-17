async function fetchJSON(url) {
  const resp = await fetch(url, {
    headers: {
      "Accept": "application/json"
    },
    credentials: "same-origin"
  });
  return resp.json();
}

async function loadDashboard() {
  try {
    const [batches, qcReports] = await Promise.all([
      fetchJSON("/api/production/batch/"),
      fetchJSON("/api/qc/report/")
    ]);

    // Total batches
    const totalBatchesEl = document.getElementById("total-batches");
    if (totalBatchesEl) {
      totalBatchesEl.innerText = batches.length;
    }

    // QC count
    const totalQcEl = document.getElementById("total-qc");
    if (totalQcEl) {
      totalQcEl.innerText = qcReports.length;
    }

    // Predicted pass count
    const predictedPassCount = qcReports.filter(r => r.predicted_pass === true).length;
    const predictedPassEl = document.getElementById("predicted-pass");
    if (predictedPassEl) {
      predictedPassEl.innerText = predictedPassCount;
    }

    // Recent batches
    const recentContainer = document.getElementById("recent-batches");
    if (recentContainer) {
      recentContainer.innerHTML = "";
      batches.slice(0, 5).forEach(b => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-transparent text-light d-flex justify-content-between align-items-center";
        li.innerHTML = `
          <span>${b.batch_no} &mdash; ${b.status}</span>
          <span class="badge bg-primary rounded-pill">
            ${(b.raw_material_detail && b.raw_material_detail.name) ? b.raw_material_detail.name : "N/A"}
          </span>
        `;
        recentContainer.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
