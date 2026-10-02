import type {
  RequestEntity,
  ReviewRequestInput,
} from "@/lib/domain/entities/RequestEntity";
import { RequestReviewForbiddenError } from "@/lib/domain/errors/RequestReviewForbiddenError";
import type { IRequestRepository } from "@/lib/domain/repositories/IRequestRepository";

const OWNER_ROLES = new Set(["OWNER", "CHU"]);

export type ReviewRequestUseCaseInput = ReviewRequestInput & {
  requestId: string;
  approverRole: string;
};

export class ReviewRequestUseCase {
  constructor(private readonly requestRepository: IRequestRepository) {}

  async execute(input: ReviewRequestUseCaseInput): Promise<RequestEntity> {
    if (!OWNER_ROLES.has(input.approverRole.trim().toUpperCase())) {
      throw new RequestReviewForbiddenError();
    }

    if (input.status === "REJECTED" && !input.rejectReason?.trim()) {
      throw new Error("reject_reason is required when rejecting a request.");
    }

    return this.requestRepository.review(input.requestId, input);
  }
}
