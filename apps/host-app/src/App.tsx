import RemotePassportForm from './remote/RemotePassportForm';

export default function App() {
  return (
    <main>
      <h1>Passport Wizard</h1>
      <p>App B — host. Runs on port 3000.</p>
      <RemotePassportForm />
    </main>
  );
}
