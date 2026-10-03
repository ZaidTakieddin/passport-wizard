import type { PassportFormProps } from 'passport-contract';
import { lazy, Suspense } from 'react';
import RemoteErrorBoundary from './RemoteErrorBoundary';

const PassportForm = lazy(() => import('passport_form/PassportForm'));

export default function RemotePassportForm(props: PassportFormProps) {
  return (
    <RemoteErrorBoundary>
      <Suspense fallback={<p role="status">Loading passport form…</p>}>
        <PassportForm {...props} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
