export class AttendanceNotCheckedInError extends Error {
  constructor(message = "You have not clocked in for this shift yet.") {
    super(message);
    this.name = "AttendanceNotCheckedInError";
  }
}
