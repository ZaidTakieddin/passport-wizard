import { loadRemote } from '@module-federation/enhanced/runtime';
import type { PassportFormProps } from 'passport-contract';
import { lazy, Suspense, useState, type ComponentType } from 'react';
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

  return (
    <RemoteErrorBoundary onRetry={() => setPassportForm(() => lazy(loadPassportForm))}>
      <Suspense fallback={<p role="status">Loading passport form…</p>}>
        <PassportForm {...props} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
