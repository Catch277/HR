import { canManageBranch, viewerFromRole } from "@/lib/domain/branchScope";
import { BranchForbiddenError } from "@/lib/domain/errors/BranchForbiddenError";
import { BranchNotFoundError } from "@/lib/domain/errors/BranchNotFoundError";
import type { IBranchRepository } from "@/lib/domain/repositories/IBranchRepository";

/** Who is asking, as a route handler knows it (`caller.userId` / `caller.role`). */
export type BranchCaller = {
  userId: string;
  role: string;
};

/**
 * The branch rule as a use case sees it (SCRUM-61): a write against `branchId` is allowed for the
 * organization's OWNER, and for a MANAGER only when they head that branch.
 *
 * This repeats what RLS does through `public.heads_branch()` on purpose. RLS is still the boundary —
 * a blocked write simply matches no row — but silently matching nothing looks like "not found" to the
 * caller and hides the real reason, so the API answers a `403` naming the rule first.
 *
 * `null` covers a record that lost its branch (`requests.branch_id` is `on delete set null`): nobody
 * heads it, so only the owner may act on it.
 */
export async function assertBranchManagedBy(
  branchRepository: IBranchRepository,
  branchId: string | null,
  caller: BranchCaller,
): Promise<void> {
  const viewer = viewerFromRole(caller.role, caller.userId);

  if (branchId === null) {
    if (!viewer.managesAllBranches) {
      throw new BranchForbiddenError();
    }

    return;
  }

  const branch = await branchRepository.findById(branchId);

  if (!branch) {
    // Includes another organization's branch: RLS scopes the read, so it simply does not exist here.
    throw new BranchNotFoundError();
  }

  if (!canManageBranch(branch, viewer)) {
    throw new BranchForbiddenError();
  }
}
