export class AttendanceAlreadyCheckedOutError extends Error {
  constructor(message = "You have already clocked out of this shift.") {
    super(message);
    this.name = "AttendanceAlreadyCheckedOutError";
  }
}
