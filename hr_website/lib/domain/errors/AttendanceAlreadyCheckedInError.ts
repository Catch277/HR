export class AttendanceAlreadyCheckedInError extends Error {
  constructor(message = "You have already clocked in for this shift.") {
    super(message);
    this.name = "AttendanceAlreadyCheckedInError";
  }
}
