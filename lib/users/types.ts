export type Role = 'reader' | 'admin';
export type UserStatus = 'active' | 'disabled' | 'deleted';

// One row of `users` (db/migrations/002_users_auth.sql), the columns sign-in reads, plus the names the account page
// shows (first_name and last_name from 002, display_name from 009) and the picture (avatar_key and avatar_updated_at
// from 011). The disabled fields and the deletion stamp arrive with the admin work that writes them.
export type User = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarKey: string | null;
  avatarUpdatedAt: Date | null;
  role: Role;
  status: UserStatus;
  acceptedTermsVersion: string | null;
  acceptedTermsAt: Date | null;
  lastSignInAt: Date | null;
  createdAt: Date;
};
