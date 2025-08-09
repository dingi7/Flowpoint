export interface AuthUser {
  uid: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  disabled?: boolean;
}

export interface AuthenticationService {
  createUser(payload: AuthUser): Promise<void>;
  updateUser(payload: Partial<AuthUser>): Promise<void>;
  getUserByID(id: string): Promise<AuthUser | null>;
  getUserByEmail(email: string): Promise<AuthUser | null>;
  deleteUser(id: string): Promise<void>;
}
