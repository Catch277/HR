import type {
  RequestEntity,
  RequestFilters,
  ReviewRequestInput,
} from "@/lib/domain/entities/RequestEntity";

export interface IRequestRepository {
  findFiltered(filters: RequestFilters): Promise<RequestEntity[]>;
  review(id: string, input: ReviewRequestInput): Promise<RequestEntity>;
}
