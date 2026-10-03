import type { PassportFormProps, PassportFormState } from 'passport-contract';
import { useEffect, useRef } from 'react';

// Compares field by field. The base64 string is the same instance until a new file is
// chosen, so comparing it is cheap even for large files.
function isSameState(a: PassportFormState, b: PassportFormState): boolean {
  const x = a.data;
  const y = b.data;
  return (
    a.valid === b.valid &&
    x.passportNumber === y.passportNumber &&
    x.firstName === y.firstName &&
    x.lastName === y.lastName &&
    x.issueDate === y.issueDate &&
    x.expiryDate === y.expiryDate &&
    x.document?.fileName === y.document?.fileName &&
    x.document?.mimeType === y.document?.mimeType &&
    x.document?.base64 === y.document?.base64
  );
}

/**
 * Reports `state` through `onChange` after mount and whenever it changes. The latest `onChange`
 * is kept in a ref, so a host passing a new function on every render can't cause a loop.
 */
export function useReportState(state: PassportFormState, onChange: PassportFormProps['onChange']) {
  const onChangeRef = useRef(onChange);
  const lastReported = useRef<PassportFormState | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (lastReported.current && isSameState(lastReported.current, state)) return;
    lastReported.current = state;
    onChangeRef.current(state);
  });
}
