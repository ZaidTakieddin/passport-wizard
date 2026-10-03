import type { PassportFormState } from 'passport-contract';
import { useState } from 'react';
import RemotePassportForm from './remote/RemotePassportForm';

export default function App() {
  // Temporary integration check: the wizard will own this state in the next step.
  const [passport, setPassport] = useState<PassportFormState | null>(null);

  let status = 'Waiting for the passport form…';
  if (passport) status = passport.valid ? 'Host received: passport form is valid.' : 'Host received: passport form is not valid yet.';

  return (
    <main>
      <h1>Passport Wizard</h1>
      <p>App B — host. Runs on port 3000.</p>
      <RemotePassportForm onChange={setPassport} />
      <p role="status">{status}</p>
    </main>
  );
}
