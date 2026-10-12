import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AuthUser,
  SecurityRole,
  OrganizationalPermissions,
  SessionTokenInfo,
  TwoFactorConfig,
  UserApprovalStatus,
  UserRole,
} from '../types';
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_NAME,
  isSuperAdminEmail,
  mapAppRoleToAccessLevel,
  mapAppRoleToDisplayRole,
} from './googleAuth';
import {
  generateTotpSecret,
  buildOtpAuthUri,
  generateQrCodeDataUrl,
  generateBackupCodes,
  verifyTotpToken,
  validateAndConsumeBackupCode,
} from './totp';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

export interface TwoFactorSetupDraft {
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  session: SessionTokenInfo | null;
  securityRole: SecurityRole;
  permissions: OrganizationalPermissions;
  isAuthenticated: boolean;
  is2FAPending: boolean;
  pending2FAUser: AuthUser | null;
  twoFactorState: {
    isEnabled: boolean;
    backupCodesRemaining: number;
    enrolledAt?: string;
  };

  // Auth Operations
  fetchGoogleIdentity: () => Promise<{
    name: string;
    email: string;
    uid: string;
    photoURL?: string;
  }>;
  submitAccessRequest: (params: {
    name: string;
    email: string;
    uid?: string;
  }) => Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }>;
  confirmGoogleAccessRequest: (params: {
    name: string;
    email: string;
    uid: string;
    photoURL?: string;
  }) => Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }>;
  loginWithEmail: (
    email: string,
    password?: string,
    extra?: { name?: string; role?: SecurityRole; organization?: string; accessReason?: string }
  ) => Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }>;
  loginWithGoogle: (profile: {
    googleId?: string;
    email: string;
    name?: string;
    picture?: string;
    organization?: string;
    discipline?: string;
    accessReason?: string;
  }) => Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }>;
  verify2FAChallenge: (
    codeOrBackup: string,
    rememberBrowser?: boolean
  ) => Promise<{ success: boolean; error?: string; method?: 'totp' | 'backup'; remainingCodes?: number }>;
  cancel2FAChallenge: () => void;

  // 2FA Management
  initiateTwoFactorSetup: () => Promise<TwoFactorSetupDraft>;
  confirmTwoFactorSetup: (
    secret: string,
    verificationCode: string,
    backupCodes: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  disableTwoFactor: (codeOrPassword?: string) => Promise<{ success: boolean; error?: string }>;
  regenerateBackupCodes: (currentTotpCode: string) => Promise<{ success: boolean; codes?: string[]; error?: string }>;

  // Session & Role Operations
  logout: () => void;
  switchSecurityRole: (role: SecurityRole) => void;
  updateCurrentUser: (updates: Partial<AuthUser>) => void;
  simulateQuickLogin: (role: 'Super Admin' | 'Project Manager' | 'BIM Specialist' | 'Viewer', enable2FAForDemo?: boolean) => void;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'bim_auth_user_central_v1',
  SESSION: 'bim_auth_session_central_v1',
  SAVED_USERS_DB: 'bim_auth_registered_users_v1',
};

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<SecurityRole, OrganizationalPermissions> = {
  'Super Admin': {
    canViewAnalytics: true,
    canEditProjects: true,
    canLogHours: true,
    canManageTeam: true,
    canAccessAdminNexus: true,
    canDeleteRecords: true,
    canExportReports: true,
    canManageSecurity: true,
    canAssignHours: true,
    canReviewClashes: true,
  },
  'Project Manager': {
    canViewAnalytics: true,
    canEditProjects: true,
    canLogHours: true,
    canManageTeam: true,
    canAccessAdminNexus: false,
    canDeleteRecords: false,
    canExportReports: true,
    canManageSecurity: false,
    canAssignHours: true,
    canReviewClashes: true,
  },
  'BIM Specialist': {
    canViewAnalytics: true,
    canEditProjects: true,
    canLogHours: true,
    canManageTeam: false,
    canAccessAdminNexus: false,
    canDeleteRecords: false,
    canExportReports: true,
    canManageSecurity: false,
    canAssignHours: true,
    canReviewClashes: true,
  },
  'Lead Coordinator': {
    canViewAnalytics: true,
    canEditProjects: true,
    canLogHours: true,
    canManageTeam: false,
    canAccessAdminNexus: false,
    canDeleteRecords: false,
    canExportReports: true,
    canManageSecurity: false,
    canAssignHours: true,
    canReviewClashes: true,
  },
  'Editor': {
    canViewAnalytics: true,
    canEditProjects: true,
    canLogHours: true,
    canManageTeam: false,
    canAccessAdminNexus: false,
    canDeleteRecords: false,
    canExportReports: true,
    canManageSecurity: false,
    canAssignHours: true,
    canReviewClashes: false,
  },
  'Viewer': {
    canViewAnalytics: false,
    canEditProjects: false,
    canLogHours: true,
    canManageTeam: false,
    canAccessAdminNexus: false,
    canDeleteRecords: false,
    canExportReports: false,
    canManageSecurity: false,
    canAssignHours: false,
    canReviewClashes: false,
  },
};

export function getRoleFromUser(user: AuthUser | null): SecurityRole {
  if (!user) return 'Viewer';
  if (user.securityRole) return user.securityRole;
  if (user.isAdmin || user.appRole === 'SUPER_ADMIN' || isSuperAdminEmail(user.email)) {
    return 'Super Admin';
  }
  if (user.appRole === 'PROJECT_MANAGER' || user.accessLevel === 'Project Manager') {
    return 'Project Manager';
  }
  if (user.role?.toLowerCase().includes('specialist') || user.role?.toLowerCase().includes('modeler')) {
    return 'BIM Specialist';
  }
  if (user.appRole === 'EDITOR' || user.accessLevel === 'Editor') {
    return 'Editor';
  }
  return 'Viewer';
}

function generateSessionToken(email: string, is2FAVerified: boolean): SessionTokenInfo {
  const token = `bpms_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days session
  return {
    token,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    ipAddress: '10.240.18.92 (Secure Gateway)',
    deviceLabel: 'Enterprise Workstation',
    browser: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome / Linux' : 'Browser Session') : 'Standard Web',
    is2FAVerified,
    lastActive: now.toISOString(),
  };
}

// Initial seed default Super Admin with full master access across all BPMS modules
const INITIAL_SUPER_ADMIN: AuthUser = {
  id: 'usr_super_admin_modelatech',
  googleId: 'google_super_admin_modelatech',
  email: 'modelatech2026@gmail.com',
  name: 'Modela Tech',
  role: 'Super Administrator & Lead Architect',
  appRole: 'SUPER_ADMIN',
  status: 'APPROVED',
  isAdmin: true,
  accessLevel: 'Super Admin',
  securityRole: 'Super Admin',
  organization: 'BPMS Core Systems & Architecture',
  accessReason: 'Executive Super Administrator with master editing and governance access',
  requestTimestamp: '2026-08-23 09:00 AM',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ModelaTech',
  twoFactor: {
    isEnabled: false,
    backupCodes: [],
    usedBackupCodes: [],
  },
  twoFactorEnabled: false,
  permissions: DEFAULT_PERMISSIONS_BY_ROLE['Super Admin'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Registered user accounts storage to persist 2FA configs per email
  const [usersDb, setUsersDb] = useState<Record<string, AuthUser>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_USERS_DB);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Error reading users db', e);
    }
    return {
      'modelatech2026@gmail.com': INITIAL_SUPER_ADMIN,
      'sushoovandas@gmail.com': {
        ...INITIAL_SUPER_ADMIN,
        id: 'usr_super_admin_sushoovan',
        email: 'sushoovandas@gmail.com',
        name: 'sushoovan Das',
      },
      'aditichakraborty2005@gmail.com': {
        ...INITIAL_SUPER_ADMIN,
        id: 'usr_super_admin_aditi',
        email: 'aditichakraborty2005@gmail.com',
        name: 'Aditi Chakraborty',
      },
    };
  });

  // Save users database
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_USERS_DB, JSON.stringify(usersDb));
    } catch (e) {
      console.warn('Error saving users db', e);
    }
  }, [usersDb]);

  // Active Authenticated User - default to null (unauthenticated by default)
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          // Verify session exists and is unexpired
          const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
          if (savedSession) {
            const parsedSession = JSON.parse(savedSession);
            if (
              parsedSession &&
              parsedSession.token &&
              new Date(parsedSession.expiresAt).getTime() > Date.now()
            ) {
              if (isSuperAdminEmail(parsed.email)) {
                return {
                  ...parsed,
                  status: 'APPROVED',
                  role: 'Super Administrator & Lead Architect',
                  appRole: 'SUPER_ADMIN',
                  isAdmin: true,
                  accessLevel: 'Super Admin',
                  securityRole: 'Super Admin',
                  permissions: DEFAULT_PERMISSIONS_BY_ROLE['Super Admin'],
                };
              }
              return parsed;
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Active Session - default to null (unauthenticated by default)
  const [session, setSession] = useState<SessionTokenInfo | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token) {
          if (new Date(parsed.expiresAt).getTime() > Date.now()) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // 2FA Challenge Pending State
  const [pending2FAUser, setPending2FAUser] = useState<AuthUser | null>(null);

  // Sync session & user to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [user]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [session]);

  const securityRole = useMemo<SecurityRole>(() => {
    return getRoleFromUser(user);
  }, [user]);

  const permissions = useMemo<OrganizationalPermissions>(() => {
    if (user?.permissions) return user.permissions;
    return DEFAULT_PERMISSIONS_BY_ROLE[securityRole] || DEFAULT_PERMISSIONS_BY_ROLE['Viewer'];
  }, [user, securityRole]);

  // Authentication status: user exists, session is active and not expired,
  // and if 2FA was enabled, session must be 2FA verified
  const isAuthenticated = useMemo<boolean>(() => {
    if (!user || !session) return false;
    const now = Date.now();
    const isExpired = new Date(session.expiresAt).getTime() <= now;
    if (isExpired) return false;

    // Strict Gate: If user has 2FA enabled, the session MUST be verified
    if (user.twoFactor?.isEnabled && !session.is2FAVerified) {
      return false;
    }

    return true;
  }, [user, session]);

  const is2FAPending = useMemo<boolean>(() => {
    return !!pending2FAUser;
  }, [pending2FAUser]);

  const twoFactorState = useMemo(() => {
    const isEnabled = user?.twoFactorEnabled !== undefined
      ? Boolean(user.twoFactorEnabled)
      : Boolean(user?.twoFactor?.isEnabled);
    const remaining = (user?.twoFactor?.backupCodes || []).length;
    return {
      isEnabled,
      backupCodesRemaining: remaining,
      enrolledAt: user?.twoFactor?.enrolledAt,
    };
  }, [user]);

  // Helper to store/update user record
  const saveUserToDb = (updatedUser: AuthUser) => {
    const emailKey = updatedUser.email.toLowerCase();
    setUsersDb((prev) => ({
      ...prev,
      [emailKey]: updatedUser,
    }));
  };

  /**
   * 1. Auto Fetch Google Identity using Firebase Auth without manual input
   */
  const fetchGoogleIdentity = async (): Promise<{
    name: string;
    email: string;
    uid: string;
    photoURL?: string;
  }> => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User';
      const email = fbUser.email || '';
      const uid = fbUser.uid;
      const photoURL = fbUser.photoURL || undefined;

      return {
        name,
        email,
        uid,
        photoURL,
      };
    } catch (popupError: any) {
      console.warn('Firebase popup notice:', popupError);
      if (auth.currentUser) {
        const u = auth.currentUser;
        return {
          name: u.displayName || u.email?.split('@')[0] || 'Google User',
          email: u.email || '',
          uid: u.uid,
          photoURL: u.photoURL || undefined,
        };
      }
      throw popupError;
    }
  };

  /**
   * 2. Confirm Google Access Request:
   * Creates Firestore request record { name, email, uid, timestamp, status: "Pending" }
   * or grants immediate access if Super Admin / Approved.
   */
  const confirmGoogleAccessRequest = async (params: {
    name: string;
    email: string;
    uid: string;
    photoURL?: string;
  }): Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }> => {
    const cleanEmail = params.email.trim().toLowerCase();
    const isSuper = isSuperAdminEmail(cleanEmail);

    if (isSuper) {
      const adminUser: AuthUser = {
        id: params.uid || 'usr_super_admin_sushoovan',
        googleId: params.uid,
        email: params.email,
        name: params.name || SUPER_ADMIN_NAME,
        role: 'Super Administrator & Lead Architect',
        appRole: 'SUPER_ADMIN',
        status: 'APPROVED',
        isAdmin: true,
        accessLevel: 'Super Admin',
        securityRole: 'Super Admin',
        permissions: DEFAULT_PERMISSIONS_BY_ROLE['Super Admin'],
        organization: 'BPMS Core Systems & Architecture',
        avatar: params.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        requestTimestamp: new Date().toISOString(),
      };

      try {
        await setDoc(
          doc(db, 'access_requests', params.uid),
          {
            name: adminUser.name,
            email: adminUser.email,
            uid: params.uid,
            timestamp: new Date().toISOString(),
            status: 'Approved',
            role: 'Super Admin',
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore admin write notice:', err);
      }

      saveUserToDb(adminUser);
      const sess = generateSessionToken(adminUser.email, true);
      setUser(adminUser);
      setSession(sess);
      setPending2FAUser(null);
      return { requires2FA: false, status: 'APPROVED', user: adminUser };
    }

    // Check if user is already an approved registered account in usersDb
    if (usersDb[cleanEmail] && usersDb[cleanEmail].status === 'APPROVED') {
      const existingApprovedUser = usersDb[cleanEmail];
      const sess = generateSessionToken(existingApprovedUser.email, true);
      setUser(existingApprovedUser);
      setSession(sess);
      setPending2FAUser(null);
      return { requires2FA: false, status: 'APPROVED', user: existingApprovedUser };
    }

    // Check Firestore access request record
    const reqRef = doc(db, 'access_requests', params.uid);
    let firestoreStatus = 'pending';
    let assignedRole: SecurityRole = 'Editor';
    const isoTimestamp = new Date().toISOString();

    try {
      const snap = await getDoc(reqRef);
      if (!snap.exists()) {
        const newRecord = {
          fullName: params.name,
          applicant_email: params.email,
          email: params.email,
          discipline: 'BIM - ACS',
          reasonForAccess: 'Sign-in Access Request for ProductionPulse BPMS',
          status: 'pending',
          submittedAt: isoTimestamp,
          createdAt: isoTimestamp,
          id: params.uid,
          uid: params.uid,
          name: params.name,
          role: 'Editor',
          requestedAt: isoTimestamp,
          timestamp: isoTimestamp,
          requestedRole: 'BIM Modeler / Editor',
          primaryDiscipline: 'BIM - ACS',
          organization: 'BIM - ACS',
          accessReason: 'Sign-in Access Request for ProductionPulse BPMS',
        };
        await setDoc(reqRef, newRecord, { merge: true });
        firestoreStatus = 'pending';
      } else {
        const data = snap.data();
        firestoreStatus = data?.status || 'pending';
        if (data?.role) assignedRole = data.role as SecurityRole;
      }
    } catch (fsErr) {
      console.warn('Firestore lookup notice:', fsErr);
      firestoreStatus = 'pending';
    }

    const appRole: UserRole =
      assignedRole === 'Super Admin'
        ? 'SUPER_ADMIN'
        : assignedRole === 'Project Manager'
        ? 'PROJECT_MANAGER'
        : assignedRole === 'Viewer'
        ? 'VIEWER'
        : 'EDITOR';

    const applicantUser: AuthUser = {
      id: params.uid,
      googleId: params.uid,
      email: params.email,
      name: params.name,
      avatar: params.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(params.name)}`,
      role: assignedRole,
      appRole,
      status: firestoreStatus.toLowerCase() === 'approved' ? 'APPROVED' : 'pending',
      isAdmin: assignedRole === 'Super Admin',
      accessLevel: mapAppRoleToAccessLevel(appRole),
      securityRole: assignedRole,
      permissions: DEFAULT_PERMISSIONS_BY_ROLE[assignedRole] || DEFAULT_PERMISSIONS_BY_ROLE['Viewer'],
      organization: 'ProductionPulse Team',
      requestTimestamp: new Date().toISOString(),
    };

    saveUserToDb(applicantUser);
    setUser(applicantUser);

    if (firestoreStatus.toLowerCase() === 'approved') {
      const sess = generateSessionToken(applicantUser.email, true);
      setSession(sess);
      setPending2FAUser(null);
      return { requires2FA: false, status: 'APPROVED', user: applicantUser };
    } else {
      const pendingSess = generateSessionToken(applicantUser.email, false);
      setSession(pendingSess);
      return { requires2FA: false, status: 'pending', user: applicantUser };
    }
  };

  /**
   * Submit direct access request with Name & Email
   */
  const submitAccessRequest = async (params: {
    name: string;
    email: string;
    uid?: string;
  }): Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }> => {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim() || cleanEmail.split('@')[0];
    const generatedUid =
      params.uid ||
      `req_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${Math.abs(
        cleanEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      )}`;

    return confirmGoogleAccessRequest({
      name: cleanName,
      email: cleanEmail,
      uid: generatedUid,
    });
  };

  /**
   * Log In With Email & Password
   */
  const loginWithEmail = async (
    email: string,
    _password?: string,
    extra?: { name?: string; role?: SecurityRole; organization?: string; accessReason?: string }
  ): Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isSuper = isSuperAdminEmail(cleanEmail);

    // Look up in database or create default
    let targetUser = usersDb[cleanEmail];

    if (!targetUser) {
      const assignedRole: SecurityRole = isSuper ? 'Super Admin' : (extra?.role || 'Viewer');
      const assignedAppRole: UserRole = isSuper ? 'SUPER_ADMIN' : 'VIEWER';

      targetUser = {
        id: isSuper ? 'usr_super_admin_sushoovan' : `usr_${Date.now()}`,
        email: cleanEmail,
        name: extra?.name || (isSuper ? SUPER_ADMIN_NAME : cleanEmail.split('@')[0]),
        role: assignedRole,
        appRole: assignedAppRole,
        status: isSuper ? 'APPROVED' : 'pending',
        isAdmin: isSuper,
        accessLevel: mapAppRoleToAccessLevel(assignedAppRole),
        securityRole: assignedRole,
        permissions: DEFAULT_PERMISSIONS_BY_ROLE[assignedRole],
        organization: extra?.organization || (isSuper ? 'BPMS Core Systems' : 'AEC Modeling Division'),
        accessReason: extra?.accessReason || 'BIM project coordination & hours logging',
        requestTimestamp: new Date().toISOString(),
        avatar: isSuper
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        twoFactor: isSuper ? INITIAL_SUPER_ADMIN.twoFactor : { isEnabled: false, backupCodes: [], usedBackupCodes: [] },
      };
      saveUserToDb(targetUser);
    }

    // Check if 2FA is enabled
    if (targetUser.twoFactor?.isEnabled) {
      setPending2FAUser(targetUser);
      return {
        requires2FA: true,
        status: targetUser.status,
        user: targetUser,
      };
    }

    // 2FA Not Enabled: Create active session directly
    const newSession = generateSessionToken(targetUser.email, false);
    setUser(targetUser);
    setSession(newSession);
    setPending2FAUser(null);

    return {
      requires2FA: false,
      status: targetUser.status,
      user: targetUser,
    };
  };

  /**
   * Log In With Google Profile
   */
  const loginWithGoogle = async (profile: {
    googleId?: string;
    email: string;
    name?: string;
    picture?: string;
    organization?: string;
    discipline?: string;
    accessReason?: string;
  }): Promise<{ requires2FA: boolean; status: UserApprovalStatus; user: AuthUser }> => {
    const cleanEmail = profile.email.trim().toLowerCase();
    const isSuper = isSuperAdminEmail(cleanEmail);

    let targetUser = usersDb[cleanEmail];

    if (!targetUser) {
      const assignedRole: SecurityRole = isSuper ? 'Super Admin' : 'Viewer';
      const assignedAppRole: UserRole = isSuper ? 'SUPER_ADMIN' : 'VIEWER';

      targetUser = {
        id: isSuper ? 'usr_super_admin_sushoovan' : `usr_${Date.now()}`,
        googleId: profile.googleId || (isSuper ? 'google_super_admin_sushoovan' : `google_${Date.now()}`),
        email: cleanEmail,
        name: profile.name || (isSuper ? SUPER_ADMIN_NAME : cleanEmail.split('@')[0]),
        role: assignedRole,
        appRole: assignedAppRole,
        status: isSuper ? 'APPROVED' : 'pending',
        isAdmin: isSuper,
        accessLevel: mapAppRoleToAccessLevel(assignedAppRole),
        securityRole: assignedRole,
        permissions: DEFAULT_PERMISSIONS_BY_ROLE[assignedRole],
        organization: profile.organization || 'BPMS Cloud Workspace',
        accessReason: profile.accessReason || 'BIM management and coordination',
        requestTimestamp: new Date().toISOString(),
        avatar: profile.picture || (isSuper
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`),
        twoFactor: isSuper ? INITIAL_SUPER_ADMIN.twoFactor : { isEnabled: false, backupCodes: [], usedBackupCodes: [] },
      };
      saveUserToDb(targetUser);
    }

    if (targetUser.twoFactor?.isEnabled) {
      setPending2FAUser(targetUser);
      return {
        requires2FA: true,
        status: targetUser.status,
        user: targetUser,
      };
    }

    const newSession = generateSessionToken(targetUser.email, false);
    setUser(targetUser);
    setSession(newSession);
    setPending2FAUser(null);

    return {
      requires2FA: false,
      status: targetUser.status,
      user: targetUser,
    };
  };

  /**
   * Verify 2FA Challenge (TOTP code or Emergency Backup Code)
   */
  const verify2FAChallenge = async (
    codeOrBackup: string,
    _rememberBrowser: boolean = true
  ): Promise<{ success: boolean; error?: string; method?: 'totp' | 'backup'; remainingCodes?: number }> => {
    if (!pending2FAUser) {
      return { success: false, error: 'No active authentication session awaiting 2FA verification.' };
    }

    const cleanInput = codeOrBackup.trim();
    const twoFactor = pending2FAUser.twoFactor;

    if (!twoFactor || !twoFactor.isEnabled) {
      // Fallback: If 2FA somehow not configured, promote session
      const sess = generateSessionToken(pending2FAUser.email, true);
      setUser(pending2FAUser);
      setSession(sess);
      setPending2FAUser(null);
      return { success: true, method: 'totp' };
    }

    // 1. Check if input is a 6-digit TOTP code
    const isDigitsOnly = /^\d{6}$/.test(cleanInput.replace(/\s+/g, ''));
    if (isDigitsOnly && twoFactor.secret) {
      const isValidTotp = await verifyTotpToken(cleanInput, twoFactor.secret);
      if (isValidTotp) {
        const sess = generateSessionToken(pending2FAUser.email, true);
        setUser(pending2FAUser);
        setSession(sess);
        setPending2FAUser(null);
        return { success: true, method: 'totp' };
      }
    }

    // 2. Check if input is an emergency backup recovery code
    const availableCodes = twoFactor.backupCodes || [];
    const usedCodes = twoFactor.usedBackupCodes || [];
    const backupValidation = validateAndConsumeBackupCode(cleanInput, availableCodes, usedCodes);

    if (backupValidation.isValid) {
      // Single-use code consumed! Update user record
      const updatedUser: AuthUser = {
        ...pending2FAUser,
        twoFactor: {
          ...twoFactor,
          backupCodes: backupValidation.remainingCodes,
          usedBackupCodes: backupValidation.updatedUsedCodes,
        },
      };

      saveUserToDb(updatedUser);
      const sess = generateSessionToken(updatedUser.email, true);
      setUser(updatedUser);
      setSession(sess);
      setPending2FAUser(null);

      return {
        success: true,
        method: 'backup',
        remainingCodes: backupValidation.remainingCodes.length,
      };
    }

    return {
      success: false,
      error: 'Invalid 6-digit code or emergency recovery code. Please check your authenticator device.',
    };
  };

  /**
   * Cancel 2FA Challenge & return to login
   */
  const cancel2FAChallenge = () => {
    setPending2FAUser(null);
  };

  /**
   * Initiate 2FA Setup Draft (Secret, QR code, Backup Codes)
   */
  const initiateTwoFactorSetup = async (): Promise<TwoFactorSetupDraft> => {
    const targetEmail = user?.email || SUPER_ADMIN_EMAIL;
    const secret = generateTotpSecret();
    const uri = buildOtpAuthUri({
      accountName: targetEmail,
      issuer: 'BIM Matrix Pro',
      secret,
    });
    const qrCodeDataUrl = await generateQrCodeDataUrl(uri);
    const backupCodes = generateBackupCodes(8);

    return {
      secret,
      uri,
      qrCodeDataUrl,
      backupCodes,
    };
  };

  /**
   * Confirm & Enable 2FA after user tests verification code
   */
  const confirmTwoFactorSetup = async (
    secret: string,
    verificationCode: string,
    backupCodes: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User must be authenticated to enable 2FA.' };
    }

    const isValid = await verifyTotpToken(verificationCode, secret);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid verification code. Please make sure your authenticator app time is synchronized.',
      };
    }

    const twoFactorConfig: TwoFactorConfig = {
      isEnabled: true,
      secret,
      enrolledAt: new Date().toISOString(),
      backupCodes,
      usedBackupCodes: [],
    };

    const updatedUser: AuthUser = {
      ...user,
      twoFactor: twoFactorConfig,
      twoFactorEnabled: true,
    };

    saveUserToDb(updatedUser);
    setUser(updatedUser);

    // Persist to Firestore
    try {
      const userDocId = user.googleId || user.id;
      if (userDocId) {
        setDoc(
          doc(db, 'users', userDocId),
          {
            email: user.email,
            twoFactorEnabled: true,
            twoFactor: twoFactorConfig,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => console.warn('Firestore 2FA update notice:', err));
      }
    } catch (e) {
      // ignore
    }

    // Update active session to mark as 2FA verified
    if (session) {
      setSession({
        ...session,
        is2FAVerified: true,
      });
    }

    return { success: true };
  };

  /**
   * Disable 2FA
   */
  const disableTwoFactor = async (_codeOrPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const updatedUser: AuthUser = {
      ...user,
      twoFactor: {
        isEnabled: false,
        secret: undefined,
        enrolledAt: undefined,
        backupCodes: [],
        usedBackupCodes: [],
      },
      twoFactorEnabled: false,
    };

    saveUserToDb(updatedUser);
    setUser(updatedUser);

    // Persist to Firestore
    try {
      const userDocId = user.googleId || user.id;
      if (userDocId) {
        setDoc(
          doc(db, 'users', userDocId),
          {
            email: user.email,
            twoFactorEnabled: false,
            'twoFactor.isEnabled': false,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => console.warn('Firestore 2FA disable notice:', err));
      }
    } catch (e) {
      // ignore
    }

    if (session) {
      setSession({
        ...session,
        is2FAVerified: false,
      });
    }

    return { success: true };
  };

  /**
   * Regenerate 8 new emergency backup recovery codes
   */
  const regenerateBackupCodes = async (
    currentTotpCode: string
  ): Promise<{ success: boolean; codes?: string[]; error?: string }> => {
    if (!user || !user.twoFactor?.secret) {
      return { success: false, error: '2FA is not active on this account.' };
    }

    const isValid = await verifyTotpToken(currentTotpCode, user.twoFactor.secret);
    if (!isValid) {
      return { success: false, error: 'Invalid verification code.' };
    }

    const newCodes = generateBackupCodes(8);
    const updatedUser: AuthUser = {
      ...user,
      twoFactor: {
        ...user.twoFactor,
        backupCodes: newCodes,
        usedBackupCodes: [],
      },
    };

    saveUserToDb(updatedUser);
    setUser(updatedUser);

    return { success: true, codes: newCodes };
  };

  /**
   * Log out and destroy session
   */
  const logout = () => {
    setUser(null);
    setSession(null);
    setPending2FAUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem('bim_tracker_current_user_v5');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bpms_redirect_target');
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  /**
   * Switch Active Security Role
   */
  const switchSecurityRole = (newRole: SecurityRole) => {
    if (!user) return;
    const newPerms = DEFAULT_PERMISSIONS_BY_ROLE[newRole] || DEFAULT_PERMISSIONS_BY_ROLE['Viewer'];
    const updatedUser: AuthUser = {
      ...user,
      securityRole: newRole,
      role: newRole,
      permissions: newPerms,
      accessLevel: newRole === 'Super Admin' ? 'Super Admin' : newRole === 'Project Manager' ? 'Project Manager' : 'Editor',
    };
    saveUserToDb(updatedUser);
    setUser(updatedUser);
  };

  /**
   * Update Profile Details
   */
  const updateCurrentUser = (updates: Partial<AuthUser>) => {
    const base = user || (updates as AuthUser);
    if (!base || !base.email) return;
    const updated: AuthUser = { ...base, ...updates };
    saveUserToDb(updated);
    setUser(updated);
  };

  /**
   * Quick simulate login for rapid testing of roles & 2FA
   */
  const simulateQuickLogin = (role: 'Super Admin' | 'Project Manager' | 'BIM Specialist' | 'Viewer', enable2FAForDemo: boolean = false) => {
    const roleMap: Record<string, { email: string; name: string; appRole: UserRole }> = {
      'Super Admin': { email: SUPER_ADMIN_EMAIL, name: SUPER_ADMIN_NAME, appRole: 'SUPER_ADMIN' },
      'Project Manager': { email: 'sarah.jenkins.bim@gmail.com', name: 'Sarah Jenkins', appRole: 'PROJECT_MANAGER' },
      'BIM Specialist': { email: 'david.kim.mep@gmail.com', name: 'David Kim', appRole: 'EDITOR' },
      'Viewer': { email: 'guest.reviewer@clientcorp.com', name: 'Alex Vance', appRole: 'VIEWER' },
    };

    const target = roleMap[role];
    const demoUser: AuthUser = {
      id: `usr_${role.toLowerCase().replace(/\s+/g, '_')}`,
      email: target.email,
      name: target.name,
      role,
      appRole: target.appRole,
      status: 'APPROVED',
      isAdmin: role === 'Super Admin',
      accessLevel: role === 'Super Admin' ? 'Super Admin' : role === 'Project Manager' ? 'Project Manager' : 'Editor',
      securityRole: role,
      permissions: DEFAULT_PERMISSIONS_BY_ROLE[role],
      organization: 'BIM Matrix Enterprise',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(target.name)}`,
      twoFactor: enable2FAForDemo ? {
        isEnabled: true,
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        enrolledAt: new Date().toISOString(),
        backupCodes: ['8421-9932', '3194-5820', '7029-4188', '5219-6301', '9812-4011', '6620-1943'],
        usedBackupCodes: [],
      } : { isEnabled: false, backupCodes: [], usedBackupCodes: [] },
      twoFactorEnabled: enable2FAForDemo,
    };

    saveUserToDb(demoUser);
    const sess = generateSessionToken(demoUser.email, true);
    setUser(demoUser);
    setSession(sess);
    setPending2FAUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        securityRole,
        permissions,
        isAuthenticated,
        is2FAPending,
        pending2FAUser,
        twoFactorState,
        fetchGoogleIdentity,
        confirmGoogleAccessRequest,
        submitAccessRequest,
        loginWithEmail,
        loginWithGoogle,
        verify2FAChallenge,
        cancel2FAChallenge,
        initiateTwoFactorSetup,
        confirmTwoFactorSetup,
        disableTwoFactor,
        regenerateBackupCodes,
        logout,
        switchSecurityRole,
        updateCurrentUser,
        simulateQuickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useOptionalAuth = () => {
  return useContext(AuthContext);
};
