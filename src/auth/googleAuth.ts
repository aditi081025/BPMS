/**
 * Google OAuth Authentication Handler & User Provisioning for BPMS Phase 1
 */

import { UserDatabaseModel, UserRole, UserApprovalStatus, AuthUser } from '../types';

export const SUPER_ADMIN_EMAIL = 'modelatech2026@gmail.com';
export const SUPER_ADMIN_NAME = 'Modela Tech';
export const SECONDARY_ADMIN_EMAIL = 'sushoovandas@gmail.com';

export const SUPER_ADMIN_WHITELIST = [
  'modelatech2026@gmail.com',
  'sushoovandas@gmail.com',
  'aditichakraborty2005@gmail.com',
];

export const SUPER_ADMIN_EMAILS = SUPER_ADMIN_WHITELIST;

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUPER_ADMIN_WHITELIST.some((e) => e.trim().toLowerCase() === clean);
}

export interface GoogleProfilePayload {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Handles incoming Google OAuth callback payload.
 * Enforces:
 * 1. If email === SUPER_ADMIN_EMAIL: Immediately grant SUPER_ADMIN and APPROVED status.
 * 2. If new user: Auto-provision in DB with status = PENDING, role = VIEWER (awaiting Nexus Admin approval).
 * 3. If existing user: Retrieve status (PENDING, APPROVED, REJECTED) and assign proper role permissions.
 */
export function handleGoogleAuthCallback(
  profile: GoogleProfilePayload,
  existingUsers: UserDatabaseModel[]
): {
  user: UserDatabaseModel;
  authUser: AuthUser;
  isNewUser: boolean;
} {
  const normalizedEmail = profile.email.trim().toLowerCase();
  const isSuperAdminUser =
    isSuperAdminEmail(normalizedEmail) ||
    profile.name.toLowerCase().includes('modela') ||
    profile.name.toLowerCase().includes('sushoovan');

  const existing = existingUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail || (u.googleId && u.googleId === profile.googleId)
  );

  const now = new Date().toISOString();

  if (isSuperAdminUser) {
    const adminUser: UserDatabaseModel = {
      id: existing?.id || 'usr_super_admin_sushoovan',
      googleId: profile.googleId || 'google_super_admin_sushoovan',
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      avatar: profile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      status: 'APPROVED',
      role: 'SUPER_ADMIN',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    return {
      user: adminUser,
      authUser: toAuthUser(adminUser),
      isNewUser: !existing,
    };
  }

  if (existing) {
    const updatedUser: UserDatabaseModel = {
      ...existing,
      name: profile.name || existing.name,
      avatar: profile.picture || existing.avatar,
      updatedAt: now,
    };

    return {
      user: updatedUser,
      authUser: toAuthUser(updatedUser),
      isNewUser: false,
    };
  }

  // New Google OAuth User: defaults to PENDING hold state
  const newUser: UserDatabaseModel = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    googleId: profile.googleId,
    email: profile.email,
    name: profile.name,
    avatar: profile.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
    status: 'PENDING',
    role: 'VIEWER',
    createdAt: now,
    updatedAt: now,
  };

  return {
    user: newUser,
    authUser: toAuthUser(newUser),
    isNewUser: true,
  };
}

export function toAuthUser(user: UserDatabaseModel): AuthUser {
  const isSuper = user.role === 'SUPER_ADMIN' || isSuperAdminEmail(user.email);
  
  return {
    id: user.id,
    googleId: user.googleId,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: mapAppRoleToDisplayRole(user.role),
    appRole: user.role,
    status: user.status,
    isAdmin: isSuper || user.role === 'PROJECT_MANAGER',
    accessLevel: mapAppRoleToAccessLevel(user.role),
    requestTimestamp: user.createdAt,
  };
}

export function mapAppRoleToAccessLevel(role: UserRole) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'PROJECT_MANAGER':
      return 'Project Manager';
    case 'EDITOR':
      return 'Editor';
    case 'VIEWER':
    default:
      return 'Viewer';
  }
}

export function mapAppRoleToDisplayRole(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Administrator & Lead Architect';
    case 'PROJECT_MANAGER':
      return 'BIM Project Manager';
    case 'EDITOR':
      return 'BIM Modeler / Editor';
    case 'VIEWER':
    default:
      return 'Guest Viewer';
  }
}
