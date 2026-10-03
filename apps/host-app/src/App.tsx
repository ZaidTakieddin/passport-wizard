import styles from './App.module.css';
import Wizard from './wizard/Wizard';

export default function App() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Passport Wizard</h1>
        <p className={styles.subtitle}>Enter your passport details, then your ID details.</p>
      </header>
      <main>
        <Wizard />
      </main>
    </div>
  );
}
