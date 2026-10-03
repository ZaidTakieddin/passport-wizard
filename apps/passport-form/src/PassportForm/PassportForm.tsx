import { zodResolver } from '@hookform/resolvers/zod';
import type { PassportFormProps, PassportFormValues } from 'passport-contract';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import DocumentField from './DocumentField';
import styles from './PassportForm.module.css';
import TextField from './TextField';
import { useReportState } from './useReportState';
import { EMPTY_PASSPORT_VALUES, getPassportFormState, nextDay, passportSchema } from './validation';

export default function PassportForm({ onChange, initialValue }: PassportFormProps) {
  // Unique ids, because the host may render other forms on the same page.
  const id = useId();
  const {
    register,
    control,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<PassportFormValues>({
    defaultValues: initialValue ?? EMPTY_PASSPORT_VALUES,
    resolver: zodResolver(passportSchema),
    // Show a field's error once it has been changed or left.
    mode: 'all',
  });

  const values = watch();
  useReportState(getPassportFormState(values), onChange);

  return (
    <form className={styles.form} noValidate onSubmit={(event) => event.preventDefault()}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Passport details</legend>
        <p className={styles.intro}>All fields are required.</p>

        <TextField
          id={`${id}-passportNumber`}
          label="Passport number"
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
