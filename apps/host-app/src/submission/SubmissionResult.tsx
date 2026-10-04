import styles from '../wizard/Wizard.module.css';
import type { SubmissionPayload } from './buildPayload';

const SHOWN_BASE64_CHARACTERS = 48;

// Keeps the on-screen JSON readable. The console gets the full payload.
function shortenBase64(key: string, value: unknown) {
  if (key === 'base64' && typeof value === 'string' && value.length > SHOWN_BASE64_CHARACTERS) {
    return `${value.slice(0, SHOWN_BASE64_CHARACTERS)}… (${value.length} characters)`;
  }
  return value;
}

export default function SubmissionResult({ payload }: { payload: SubmissionPayload }) {
  const isShortened = payload.passport.document.base64.length > SHOWN_BASE64_CHARACTERS;

  return (
    <div className={styles.result}>
      <p className={styles.resultText}>
        Your passport and ID details were combined into this JSON payload. It was also logged to the browser
        console.
      </p>
      <pre className={styles.payload}>
        <code>{JSON.stringify(payload, shortenBase64, 2)}</code>
      </pre>
      {isShortened && (
        <p className={styles.note}>
          The document&apos;s base64 is shortened here. The console has the full value.
        </p>
      )}
    </div>
  );
}
