import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "The password must be at least 8 characters long.")
    .max(100),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export type AuthUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string;
  isTrueAdmin: boolean;
};
export const emailSchema = z.object({
  email: z.string().email(),
});

export type EmailFormValue = z.infer<typeof emailSchema>;
export const verificationCodeSchema = z.object({
  code: z.string().min(6).max(6),
});

export type VerificationCode = z.infer<typeof verificationCodeSchema>;

export const resetPasswordVerificationCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6, "The code must be 6 characters long.").max(8),
  password: z
    .string()
    .min(8, "The password must be at least 8 characters long.")
    .max(100),
  passwordConfirmation: z
    .string()
    .min(8, "The password must be at least 8 characters long.")
    .max(100),
});

export type ResetPasswordVerificationCode = z.infer<
  typeof resetPasswordVerificationCodeSchema
>;

export const credentialsSignUpSchema = credentialsSchema.extend({
  confirmPassword: z
    .string()
    .min(8, "The password must be at least 8 characters long.")
    .max(100),
});

export type CredentialsSignUp = z.infer<typeof credentialsSignUpSchema>;

export const credentialsResetPasswordSchema = z.object({
  email: z.string().email(),
});

export type CredentialsResetPassword = z.infer<
  typeof credentialsResetPasswordSchema
>;

export interface AuthenticationService {
  signUpWithEmailAndPassword(credentials: CredentialsSignUp): Promise<void>;
  signInWithCustomToken(token: string): Promise<void>;
  signInWithEmailAndPassword(credentials: Credentials): Promise<void>;
  onUserStateChanged(callback: (user: AuthUser | null) => void): () => void;
  sendPasswordResetEmail(email: string): Promise<void>;
  signOut(): Promise<void>;
}
