export class StaffForbiddenError extends Error {
  constructor() {
    super(
      "Only an OWNER/CHU manager may manage staff accounts, and only an OWNER may grant or revoke the OWNER role.",
    );
    this.name = "StaffForbiddenError";
  }
}