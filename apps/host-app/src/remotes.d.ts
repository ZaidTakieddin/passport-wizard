// Types for modules loaded from Module Federation remotes at runtime.
declare module 'passport_form/PassportForm' {
  import type { PassportFormProps } from 'passport-contract';
  import type { ComponentType } from 'react';

  const PassportForm: ComponentType<PassportFormProps>;
  export default PassportForm;
}
