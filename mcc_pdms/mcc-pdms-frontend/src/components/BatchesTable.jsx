// src/components/BatchesTable.jsx
import { useEffect, useState } from "react";

function BatchesTable() {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/batches/")
      .then((res) => res.json())
      .then((data) => setBatches(data));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Batch</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {batches.map((b) => (
          <tr key={b.id}>
            <td>{b.batch_no}</td>
            <td>{b.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BatchesTable;
