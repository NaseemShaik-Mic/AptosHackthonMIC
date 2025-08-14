import { useState } from 'react';
import { client } from '../utils/aptosClient';

export default function GetRecords({ moduleAddr, patientAddr }: { moduleAddr: string, patientAddr: string }) {
  const [records, setRecords] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  async function fetchRecords() {
    if (!patientAddr) return alert('Set patient address');
    try {
      setStatus('Fetching records...');
      const res = await client.getAccountResource(patientAddr, `${moduleAddr}::health_record::HealthRecord`);
      const cidArray = res?.data?.cid || [];
      setRecords(cidArray);
      setStatus('Fetched ' + cidArray.length + ' records');
    } catch (e: any) {
      console.error(e);
      setStatus('Error: ' + (e.message || e));
    }
  }

  return (
    <div>
      <button onClick={fetchRecords}>Get Records</button>
      <div>{status}</div>
      <ul>
        {records.map((c, i) => (
          <li key={i}>
            <a href={`https://ipfs.io/ipfs/${c}`} target="_blank" rel="noreferrer">{c}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
