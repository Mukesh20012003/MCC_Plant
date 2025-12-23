export async function fetchQcReports() {
  const accessToken = localStorage.getItem("access");

  const res = await fetch("http://127.0.0.1:8000/api/qc-reports/", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load QC reports");
  }
  return res.json();
}
