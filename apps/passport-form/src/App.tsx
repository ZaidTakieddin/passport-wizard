import PassportForm from './PassportForm/PassportForm';

// Standalone page for developing the remote on its own. The host renders PassportForm directly.
export default function App() {
  return (
    <main>
      <h1>Passport Form</h1>
      <p>App A — remote. Runs on port 3001.</p>
      <PassportForm />
    </main>
  );
}
