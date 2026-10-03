/** Thrown by data stores when input is rejected; carries per-field messages for the UI. */
export class DataValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "DataValidationError";
  }
}
