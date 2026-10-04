import { loadRemote } from '@module-federation/enhanced/runtime';
import type { PassportFormProps } from 'passport-contract';
import { lazy, Suspense, useRef, useState, type ComponentType } from 'react';
import styles from './Remote.module.css';
import RemoteErrorBoundary from './RemoteErrorBoundary';

type PassportFormModule = { default: ComponentType<PassportFormProps> };

// Loads through the Module Federation runtime rather than the bundler's import(): the bundler
// keeps a failed remote module failed for the life of the page, the runtime tries again.
async function loadPassportForm(): Promise<PassportFormModule> {
  const module = await loadRemote<PassportFormModule>('passport_form/PassportForm');
  if (!module) throw new Error('The passport_form remote returned no module.');
  return module;
}

export default function RemotePassportForm(props: PassportFormProps) {
  // React.lazy also remembers a failed load, so each retry needs a new lazy component.
  const [PassportForm, setPassportForm] = useState(() => lazy(loadPassportForm));
  const regionRef = useRef<HTMLDivElement>(null);

  function retry() {
    setPassportForm(() => lazy(loadPassportForm));
    // The Try again button is about to disappear: keep focus here instead of losing it to the page.
    regionRef.current?.focus();
  }

  return (
    <div ref={regionRef} tabIndex={-1} className={styles.region}>
      <RemoteErrorBoundary onRetry={retry}>
        <Suspense
          fallback={
            <p role="status" className={styles.notice}>
              Loading passport form…
            </p>
          }
        >
          <PassportForm {...props} />
        </Suspense>
      </RemoteErrorBoundary>
    </div>
  );
}
