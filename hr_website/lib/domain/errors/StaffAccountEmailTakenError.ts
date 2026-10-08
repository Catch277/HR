export class StaffAccountEmailTakenError extends Error {
  constructor() {
    super(
      "An account already exists for this email address, or it is already a member of the organization. Invite it instead.",
    );
    this.name = "StaffAccountEmailTakenError";
  }
}