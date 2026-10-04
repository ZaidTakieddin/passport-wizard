import type { PassportFormState, PassportFormValues } from 'passport-contract';
import { useState } from 'react';
import styles from './App.module.css';
import PassportForm from './PassportForm/PassportForm';

// Shortens the file contents so the reported state stays readable.
function shortenBase64(key: string, value: unknown) {
  if (key === 'base64' && typeof value === 'string' && value.length > 48) {
    return `${value.slice(0, 48)}… (${value.length} characters)`;
  }
  return value;
}

// Standalone page for developing the remote on its own. It shows exactly what a host receives.
export default function App() {
  const [state, setState] = useState<PassportFormState | null>(null);
  // Remounting with the last reported data simulates a host navigating away and back.
  const [mount, setMount] = useState<{ key: number; initialValue?: PassportFormValues }>({ key: 0 });

  return (
    <main className={styles.page}>
      <h1>Passport Form</h1>
      <p>App A — remote. Runs on port 3001.</p>
      <PassportForm key={mount.key} initialValue={mount.initialValue} onChange={setState} />
      <section className={styles.reported} aria-labelledby="reported-title">
        <h2 id="reported-title">Reported to the host</h2>
        <button
          type="button"
          disabled={!state}
          onClick={() => setMount((current) => ({ key: current.key + 1, initialValue: state?.data }))}
        >
          Remount with reported data
        </button>
        <pre className={styles.output}>
          {state ? JSON.stringify(state, shortenBase64, 2) : 'Nothing reported yet.'}
        </pre>
      </section>
    </main>
  );
}
