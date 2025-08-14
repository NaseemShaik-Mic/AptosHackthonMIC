import { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfs';

declare global { interface Window { aptos?: any } }

export default function AddRecord({ moduleAddr, patientAddr }: { moduleAddr: string, patientAddr: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  async function handleAdd() {
    if (!file) return alert('Choose a file first');
    if (!patientAddr) return alert('Connect and set patient address');
    try {
      setStatus('Uploading to IPFS...');
      const cid = await uploadToIPFS(file);
      setStatus('Submitting transaction...');
      const payload = {
        type: 'entry_function_payload',
        function: `${moduleAddr}::health_record::add_record`,
        type_arguments: [],
        arguments: [patientAddr, cid],
      };
      await window.aptos.signAndSubmitTransaction(payload);
      setStatus('Record added: ' + cid);
      alert('Record added with CID: ' + cid);
    } catch (e: any) {
      console.error(e);
      setStatus('Error: ' + (e.message || e));
    }
  }

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleAdd}>Upload & Add Record</button>
      <div>{status}</div>
    </div>
  );
}
