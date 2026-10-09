import {
  MAX_REQUEST_CONTENT_LENGTH,
  MAX_REQUEST_TITLE_LENGTH,
  type CreateRequestInput,
  type RequestEntity,
} from "@/lib/domain/entities/RequestEntity";
import { BranchNotFoundError } from "@/lib/domain/errors/BranchNotFoundError";
import { RequestBranchForbiddenError } from "@/lib/domain/errors/RequestBranchForbiddenError";
import { RequestBranchNotAssignedError } from "@/lib/domain/errors/RequestBranchNotAssignedError";
import { RequestInputError } from "@/lib/domain/errors/RequestInputError";
import type { IBranchRepository } from "@/lib/domain/repositories/IBranchRepository";
import type { IRequestRepository } from "@/lib/domain/repositories/IRequestRepository";
import { isManagerRole } from "@/lib/domain/roles";

/**
 * The caller as the route handler knows it: who files, their role and the branch they belong to
 * (SCRUM-63). All three come from the session — the body never names the requester.
 */
export type CreateRequestUseCaseInput = CreateRequestInput & {
  requesterId: string;
  requesterRole: string;
  /** `users.branch_id`; `null` means the account belongs to no branch yet. */
  requesterBranchId: string | null;
};

export class CreateRequestUseCase {
  constructor(
    private readonly requestRepository: IRequestRepository,
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(input: CreateRequestUseCaseInput): Promise<RequestEntity> {
    const title = input.title.trim();
    const content = input.content?.trim() ?? "";

    if (!title || title.length > MAX_REQUEST_TITLE_LENGTH) {
      throw new RequestInputError(
        `title must be a non-empty string of at most ${MAX_REQUEST_TITLE_LENGTH} characters.`,
      );
    }

    if (content.length > MAX_REQUEST_CONTENT_LENGTH) {
      throw new RequestInputError(
        `content must be at most ${MAX_REQUEST_CONTENT_LENGTH} characters.`,
      );
    }

    // SCRUM-63: an employee works inside one branch, so their đơn must name that branch, and an
    // account that belongs to no branch cannot file at all. A manager may file for any branch they
    // can see — they run the operation. `requests_insert_own` repeats both halves in the database;
    // this check is here so the caller gets a sentence instead of a policy that matched no row.
    if (!isManagerRole(input.requesterRole)) {
      if (input.requesterBranchId === null) {
        throw new RequestBranchNotAssignedError();
      }

      if (input.branchId !== input.requesterBranchId) {
        throw new RequestBranchForbiddenError();
      }
    }

    // A request belongs to a branch, and the branch list is organization-scoped (SCRUM-60), so a
    // branch this caller cannot see — including another tenant's — is simply unknown here.
    const branch = await this.branchRepository.findById(input.branchId);

    if (!branch) {
      throw new BranchNotFoundError();
    }

    return this.requestRepository.create({
      branchId: input.branchId,
      requestType: input.requestType,
      title,
      // A blank note is an absent note, never an empty string in the column.
      content: content || null,
      userId: input.requesterId,
    });
  }
}
