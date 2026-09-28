import type { User } from "@/lib/domain/entities/User";

export interface IUserRepository {
  getById(id: string): Promise<User | null>;
}
