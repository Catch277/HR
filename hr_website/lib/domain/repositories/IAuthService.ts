import type { AuthSession } from "@/lib/domain/entities/AuthSession";
import type { AuthSignUpResult } from "@/lib/domain/entities/AuthSignUpResult";

export interface IAuthService {
  signIn(email: string, password: string): Promise<AuthSession>;
  signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<AuthSignUpResult>;
  signOut(): Promise<void>;
}

