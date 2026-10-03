import { lazy, Suspense } from 'react';
import RemoteErrorBoundary from './RemoteErrorBoundary';

const PassportForm = lazy(() => import('passport_form/PassportForm'));

export default function RemotePassportForm() {
  return (
    <RemoteErrorBoundary>
      <Suspense fallback={<p role="status">Loading passport form…</p>}>
        <PassportForm />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
