export class AttendanceVerifyForbiddenError extends Error {
  constructor() {
    super("Only an OWNER/CHU manager may verify an attendance record.");
    this.name = "AttendanceVerifyForbiddenError";
  }
}