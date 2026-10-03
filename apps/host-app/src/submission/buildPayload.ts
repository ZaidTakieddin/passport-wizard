import type { PassportData } from 'passport-contract';
import type { IdInfo } from '../id-info/idInfo';

/** The JSON payload produced on submit, in the shape of the assessment's example. */
export interface SubmissionPayload {
  passport: PassportData;
  idInfo: IdInfo;
}

// Fields are copied one by one so the payload has exactly the documented keys and order,
// even if the remote's data ever carries extra fields.
export function buildPayload(passport: PassportData, idInfo: IdInfo): SubmissionPayload {
  return {
    passport: {
      passportNumber: passport.passportNumber,
      firstName: passport.firstName,
      lastName: passport.lastName,
      issueDate: passport.issueDate,
      expiryDate: passport.expiryDate,
      document: {
        fileName: passport.document.fileName,
        mimeType: passport.document.mimeType,
        base64: passport.document.base64,
      },
    },
    idInfo: {
      idNumber: idInfo.idNumber,
      nationality: idInfo.nationality,
    },
  };
}
