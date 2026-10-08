export class AttendanceComplaintForbiddenError extends Error {
  constructor() {
    super(
      "Only the employee on the record or an OWNER/CHU manager may raise this complaint.",
    );
    this.name = "AttendanceComplaintForbiddenError";
  }
}