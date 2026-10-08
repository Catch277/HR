export class AttendanceCorrectionForbiddenError extends Error {
  constructor() {
    super("Only an OWNER/CHU manager may correct an attendance record.");
    this.name = "AttendanceCorrectionForbiddenError";
  }
}