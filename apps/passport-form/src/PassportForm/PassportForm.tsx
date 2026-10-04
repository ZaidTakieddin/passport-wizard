import { zodResolver } from '@hookform/resolvers/zod';
import type { PassportFormProps, PassportFormValues } from 'passport-contract';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import DocumentField from './DocumentField';
import styles from './PassportForm.module.css';
import TextField from './TextField';
import { useReportState } from './useReportState';
import {
  EMPTY_PASSPORT_VALUES,
  getPassportFormState,
  nextDay,
  PASSPORT_NUMBER_MAX_LENGTH,
  PASSPORT_NUMBER_MIN_LENGTH,
  passportSchema,
} from './validation';

export default function PassportForm({ onChange, initialValue }: PassportFormProps) {
  // Unique ids, because the host may render other forms on the same page.
  const id = useId();
  const {
    register,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<PassportFormValues>({
    defaultValues: initialValue ?? EMPTY_PASSPORT_VALUES,
    resolver: zodResolver(passportSchema),
    // Show a field's error once it has been changed or left.
    mode: 'all',
  });

  // Every field has a default value, so the watched values are always complete.
  const values = useWatch({ control }) as PassportFormValues;
  useReportState(getPassportFormState(values), onChange);

  return (
    <form className={styles.form} noValidate onSubmit={(event) => event.preventDefault()}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Passport details</legend>
        <p className={styles.intro}>All fields are required.</p>

        <TextField
          id={`${id}-passportNumber`}
          label="Passport number"
          hint={`${PASSPORT_NUMBER_MIN_LENGTH} to ${PASSPORT_NUMBER_MAX_LENGTH} capital letters (A–Z) and digits (0–9), as printed on your passport.`}
          error={errors.passportNumber?.message}
          registration={register('passportNumber')}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />

        <div className={styles.row}>
          <TextField
            id={`${id}-firstName`}
            label="First name"
            error={errors.firstName?.message}
            registration={register('firstName')}
            autoComplete="given-name"
          />
          <TextField
            id={`${id}-lastName`}
            label="Last name"
            error={errors.lastName?.message}
            registration={register('lastName')}
            autoComplete="family-name"
          />
        </div>

        <div className={styles.row}>
          <TextField
            id={`${id}-issueDate`}
            type="date"
            label="Issue date"
            error={errors.issueDate?.message}
            registration={register('issueDate', {
              // The expiry rule depends on this date, so re-check expiry once it has a value.
              onChange: () => {
                if (getValues('expiryDate')) void trigger('expiryDate');
              },
            })}
          />
          <TextField
            id={`${id}-expiryDate`}
            type="date"
            label="Expiry date"
            error={errors.expiryDate?.message}
            registration={register('expiryDate')}
            min={nextDay(values.issueDate)}
          />
        </div>

        <DocumentField id={`${id}-document`} control={control} />
      </fieldset>
    </form>
  );
}
