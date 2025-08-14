import { useState } from 'react';

declare global { interface Window { aptos?: any } }

export default function AccessControl({ moduleAddr }: { moduleAddr: string }) {
  const [doctor, setDoctor] = useState('');

  async function grant() {
    if (!doctor) return alert('Enter doctor address');
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddr}::health_record::grant_access`,
      type_arguments: [],
      arguments: [doctor],
    };
    await window.aptos.signAndSubmitTransaction(payload);
    alert('Access granted to ' + doctor);
  }

  async function revoke() {
    if (!doctor) return alert('Enter doctor address');
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddr}::health_record::revoke_access`,
      type_arguments: [],
      arguments: [doctor],
    };
    await window.aptos.signAndSubmitTransaction(payload);
    alert('Access revoked for ' + doctor);
  }

  return (
    <div>
      <input
        placeholder="Doctor address (0x...)"
        value={doctor}
        onChange={(e) => setDoctor(e.target.value)}
      />
      <button onClick={grant}>Grant</button>
      <button onClick={revoke}>Revoke</button>
    </div>
  );
}
