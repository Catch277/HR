export class RequestReviewForbiddenError extends Error {
  constructor() {
    super("Only an owner account can review requests.");
    this.name = "RequestReviewForbiddenError";
  }
}
