import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiErrorBody } from "@/types/api";

/**
 * Puts the API's field errors (errorDetails) on the matching form fields.
 * Returns true when at least one field got an error; otherwise the caller
 * shows `error.message` above the form.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: ApiErrorBody,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  // errorCodes that belong to one field, e.g. { EMAIL_TAKEN: "email" }
  codeToField: Partial<Record<string, Path<T>>> = {},
): boolean {
  let applied = false;

  const codeField = codeToField[error.errorCode];
  if (codeField) {
    setError(codeField, { type: "server", message: error.message }, { shouldFocus: true });
    applied = true;
  }

  for (const detail of error.errorDetails) {
    const field = fields.find((f) => f === detail.path);
    if (field) {
      setError(field, { type: "server", message: detail.message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
