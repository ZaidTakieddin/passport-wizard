import type { PassportDocumentMimeType, PassportFormValues } from 'passport-contract';
import { useRef, useState, type ChangeEvent } from 'react';
import { useController, type Control } from 'react-hook-form';
import styles from './PassportForm.module.css';
import { readFileAsBase64 } from './readFileAsBase64';
import { ACCEPTED_MIME_TYPES, getFileSelectionError, isAcceptedMimeType } from './validation';

// File extensions are listed too, for systems that don't map them to MIME types.
const ACCEPT = [...ACCEPTED_MIME_TYPES, '.pdf', '.png', '.jpg', '.jpeg'].join(',');

const TYPE_LABELS: Record<PassportDocumentMimeType, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPEG',
};

type DocumentFieldProps = {
  id: string;
  control: Control<PassportFormValues>;
};

export default function DocumentField({ id, control }: DocumentFieldProps) {
  const { field, fieldState } = useController({ name: 'document', control });
  const inputRef = useRef<HTMLInputElement>(null);
  // Identifies the latest selection, so a slow read can't overwrite a newer file.
  const latestSelection = useRef(0);
  const [isReading, setIsReading] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const passportDocument = field.value;
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const statusId = `${id}-status`;
  const errorId = `${id}-error`;
  const error = isReading ? undefined : (selectionError ?? fieldState.error?.message);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    // An empty selection means the picker was cancelled: keep the current file.
    if (files.length === 0) return;
    // Clear the input so that choosing the same file again still triggers a change.
    input.value = '';

    const selection = ++latestSelection.current;
    const [file] = files;
    const mimeType = file.type;
    const problem = getFileSelectionError(files);

    if (problem || !isAcceptedMimeType(mimeType)) {
      setSelectionError(problem ?? 'Upload a PDF, PNG or JPEG file.');
      setIsReading(false);
      field.onChange(null);
      return;
    }

    setSelectionError(null);
    setIsReading(true);
    // Not valid until the new file has been read.
    field.onChange(null);

    try {
      const base64 = await readFileAsBase64(file);
      if (selection !== latestSelection.current) return;
      field.onChange({ fileName: file.name, mimeType, base64 });
    } catch {
      if (selection !== latestSelection.current) return;
      setSelectionError('This file couldn’t be read. Choose another file.');
    } finally {
      if (selection === latestSelection.current) setIsReading(false);
    }
  }

  function removeFile() {
    latestSelection.current += 1;
    setSelectionError(null);
    setIsReading(false);
    field.onChange(null);
    inputRef.current?.focus();
  }

  let status = 'No file chosen.';
  if (isReading) status = 'Reading file…';
  else if (passportDocument) status = `${passportDocument.fileName} (${TYPE_LABELS[passportDocument.mimeType]})`;

  return (
    <div className={styles.field}>
      <label id={labelId} htmlFor={id} className={styles.label}>
        Passport document
      </label>
      <p id={hintId} className={styles.hint}>
        One PDF, PNG or JPEG file, up to 5 MB.
      </p>
      <div className={styles.fileRow}>
        <input
          ref={inputRef}
          id={id}
          name={field.name}
          type="file"
          accept={ACCEPT}
          className={styles.fileInput}
          aria-labelledby={labelId}
          aria-describedby={[hintId, statusId, error ? errorId : ''].filter(Boolean).join(' ')}
          aria-invalid={Boolean(error)}
          aria-required="true"
          onChange={handleFileChange}
        />
        {/* Visual trigger for the hidden input: clicking a label opens the file picker. */}
        <label htmlFor={id} className={styles.fileButton}>
          {passportDocument ? 'Replace file' : 'Choose file'}
        </label>
        {passportDocument && (
          <button type="button" className={styles.secondaryButton} onClick={removeFile}>
            Remove file
          </button>
        )}
      </div>
      <p id={statusId} className={styles.fileStatus} aria-live="polite">
        {status}
      </p>
      <p id={errorId} className={styles.error} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
