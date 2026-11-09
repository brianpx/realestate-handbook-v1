export type Role = 'reader' | 'admin';
export type UserStatus = 'active' | 'disabled' | 'deleted';

// One row of `users` (db/migrations/002_users_auth.sql), the columns sign-in reads. Names, the disabled fields and
// the deletion stamp arrive with the account and admin work that writes them.
export type User = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  role: Role;
  status: UserStatus;
  acceptedTermsVersion: string | null;
  acceptedTermsAt: Date | null;
  lastSignInAt: Date | null;
  createdAt: Date;
};
