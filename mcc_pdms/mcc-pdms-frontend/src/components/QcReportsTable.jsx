import { useEffect, useState } from "react";
import { fetchQcReports } from "../services/qcReports";

function QcReportsTable() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchQcReports()
      .then(setReports)
      .catch((err) => console.error(err));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Batch</th>
          <th>Predicted</th>
          <th>Probability</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((r) => (
          <tr key={r.id}>
            <td>{r.batch_no || r.batch}</td>
            <td>{r.predicted_pass ? "Pass" : "Fail"}</td>
            <td>{r.predicted_probability}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default QcReportsTable;
