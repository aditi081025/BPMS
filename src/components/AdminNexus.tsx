import React, { useState, useEffect, useMemo } from 'react';
import { useBimData } from '../context/BimDataContext';
import { UserAccessRecord, AccessLevel, OnboardingRequest, UserRole, PRIMARY_DISCIPLINES, Discipline } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserPlus,
  KeyRound,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Building2,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Clock,
  Check,
  X,
  Layers,
  ArrowRight,
  FileText,
  Activity,
  UserX,
  AlertTriangle,
  Mail,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, mapAppRoleToAccessLevel } from '../auth/googleAuth';
import { SecuritySettingsModal } from './SecuritySettingsModal';
import { db } from '../firebase/config';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

export const AdminNexus: React.FC = () => {
  const {
    projects,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    onboardingRequests,
    setOnboardingRequests,
    auditLogs,
    addAuditLog,
    approveOnboardingRequest,
    rejectOnboardingRequest,
    reopenOnboardingRequest,
    deleteOnboardingRequest,
    signInWithGoogle,
    theme,
    currentUser,
    setCurrentUser,
  } = useBimData();
  const isLight = theme === 'light';

  // Sub-tabs: 'active-users' | 'pending-onboarding' | 'rejected-logs' | 'audit-logs'
  const [activeSubTab, setActiveSubTab] = useState<
    'active-users' | 'pending-onboarding' | 'rejected-logs' | 'audit-logs'
  >('pending-onboarding');

  // Selected role for each pending request
  const [pendingRoleMap, setPendingRoleMap] = useState<Record<string, UserRole>>({});
  // Selected discipline for each pending request
  const [pendingDisciplineMap, setPendingDisciplineMap] = useState<Record<string, Discipline>>({});

  // Audit search & filter state
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState<string>('all');

  // Rejected logs search filter
  const [rejectedSearchQuery, setRejectedSearchQuery] = useState('');

  // Onboarding status filter state: default 'pending' to strictly show active pending requests
  const [onboardingFilter, setOnboardingFilter] = useState<'pending' | 'approved'>('pending');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Stored permissions map keyed by user/employee id
  const [permissionsMap, setPermissionsMap] = useState<Record<string, Partial<UserAccessRecord>>>(() => {
    try {
      const saved = localStorage.getItem('bim_tracker_permissions_map_v5');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      'emp-2': {
        accessLevel: 'Super Admin',
        canEditProjects: true,
        canEditHours: true,
        canManageTeam: true,
        canDeleteRecords: true,
        canExportReports: true,
      },
      'emp-aditi': {
        accessLevel: 'Editor',
        canEditProjects: true,
        canEditHours: true,
        canManageTeam: false,
        canDeleteRecords: false,
        canExportReports: true,
      },
    };
  });

  useEffect(() => {
    localStorage.setItem('bim_tracker_permissions_map_v5', JSON.stringify(permissionsMap));
  }, [permissionsMap]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const mapDocToRequest = (d: any): OnboardingRequest | null => {
    const data = d.data();
    if (!data || !data.email) return null;
    const rawStatus = (data.status || 'pending').toLowerCase();
    const mappedStatus =
      rawStatus === 'approved'
        ? 'APPROVED'
        : rawStatus === 'rejected'
        ? 'REJECTED'
        : 'pending';
    const fullName = data.fullName || data.name || data.email.split('@')[0];
    const discipline = data.discipline || data.primaryDiscipline || data.organization || 'BIM - ACS';
    const reasonForAccess = data.reasonForAccess || data.accessReason || 'Sign-in Access Request for ProductionPulse BPMS';
    const createdAt = data.createdAt || data.requestedAt || data.timestamp || new Date().toISOString();

    return {
      id: d.id,
      googleId: data.uid || d.id,
      email: data.email,
      name: fullName,
      fullName: fullName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
      role: data.role || 'Editor',
      requestedRole: data.requestedRole || data.role || 'BIM Modeler / Editor',
      primaryDiscipline: discipline,
      discipline: discipline,
      organization: data.organization || discipline,
      reasonForAccess: reasonForAccess,
      accessReason: reasonForAccess,
      createdAt: createdAt,
      requestedAt: createdAt,
      requestTimestamp: createdAt,
      timestamp: createdAt,
      status: rawStatus === 'pending' ? 'pending' : (mappedStatus as any),
      notes: data.notes || 'Sign-in access request awaiting Super Admin review in Admin Nexus.',
    };
  };

  // Active Real-Time Hook / Query for Pending Access Requests from PostgreSQL
  const fetchPendingRequests = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/access-requests');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const list: OnboardingRequest[] = json.data.map((item: any) => ({
            id: item.id,
            googleId: item.userId || item.id,
            email: item.applicantEmail,
            name: item.fullName,
            fullName: item.fullName,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.fullName)}`,
            role: item.requestedRole || 'Editor',
            requestedRole: item.requestedRole || 'Editor',
            primaryDiscipline: item.discipline || 'BIM - ACS',
            discipline: item.discipline || 'BIM - ACS',
            organization: item.discipline || 'BIM - ACS',
            reasonForAccess: item.reasonForAccess,
            accessReason: item.reasonForAccess,
            createdAt: item.submittedAt || item.createdAt,
            requestedAt: item.submittedAt || item.createdAt,
            requestTimestamp: new Date(item.submittedAt || item.createdAt).toLocaleString(),
            timestamp: item.submittedAt || item.createdAt,
            status: item.status.toLowerCase() === 'pending' ? 'pending' : item.status,
            reviewedBy: item.reviewedBy,
            notes: 'Sign-in access request in PostgreSQL database.',
          }));
          setOnboardingRequests(list);
        }
      }
    } catch (err) {
      console.warn('Admin Nexus SQL pending fetch notice:', err);
    }
    setIsSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Periodic polling & initial fetch in Admin Nexus
  useEffect(() => {
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 12000);
    return () => clearInterval(interval);
  }, []);

  const isReqPending = (status?: string) =>
    !status ||
    status === 'pending' ||
    status.toUpperCase() === 'PENDING' ||
    status.toLowerCase() === 'pending' ||
    status.toLowerCase() === 'pending_approval' ||
    status.toLowerCase().includes('pending');

  // Dynamic Team Efficiency reference
  const members = employees;

  // Synchronize users automatically with Team Efficiency (employees) and any pending onboarding requests
  const users: UserAccessRecord[] = useMemo(() => {
    const list: UserAccessRecord[] = employees.map((emp, index) => {
      const customPerm = permissionsMap[emp.id] || {};
      const isSuperAdminUser =
        emp.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
        emp.name.toLowerCase().includes('sushoovan') ||
        emp.role?.toLowerCase().includes('super admin');

      const matchedReq = onboardingRequests.find(
        (r) => r.email.toLowerCase() === emp.email.toLowerCase()
      );

      const defaultAccessLevel: AccessLevel = isSuperAdminUser
        ? 'Super Admin'
        : matchedReq?.assignedAccessLevel
        ? matchedReq.assignedAccessLevel
        : emp.role?.toLowerCase().includes('viewer') || (matchedReq && isReqPending(matchedReq.status))
        ? 'Viewer'
        : 'Editor';

      const accessLevel = customPerm.accessLevel || defaultAccessLevel;
      const isSuper = accessLevel === 'Super Admin';
      const isAdmin = accessLevel === 'BIM Admin';
      const isEditor = accessLevel === 'Editor';
      const isPM = accessLevel === 'Project Manager';

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        accessLevel,
        canEditProjects: customPerm.canEditProjects ?? (isSuper || isAdmin || isEditor || isPM),
        canEditHours: customPerm.canEditHours ?? true,
        canManageTeam: customPerm.canManageTeam ?? (isSuper || isAdmin),
        canDeleteRecords: customPerm.canDeleteRecords ?? isSuper,
        canExportReports: customPerm.canExportReports ?? true,
        assignedProjectIds: ['all'],
        status: matchedReq && isReqPending(matchedReq.status) ? 'Pending Approval' : emp.status === 'Suspended' ? 'Suspended' : 'Active',
        lastActive: isSuperAdminUser ? 'Active (Super Admin)' : `${(index + 1) * 14} mins ago`,
      };
    });

    // Also include any external Google onboarding requests not yet in employees (strictly exclude rejected)
    onboardingRequests.forEach((req) => {
      if ((req.status || '').toUpperCase() === 'REJECTED') return;
      const alreadyInList = list.some(
        (u) => u.email.toLowerCase() === req.email.toLowerCase()
      );
      if (!alreadyInList) {
        const customPerm = permissionsMap[req.id] || {};
        const isSuper = (customPerm.accessLevel || req.assignedAccessLevel) === 'Super Admin';
        const isAdmin = (customPerm.accessLevel || req.assignedAccessLevel) === 'BIM Admin';
        const isEditor = (customPerm.accessLevel || req.assignedAccessLevel) === 'Editor';
        const isPM = (customPerm.accessLevel || req.assignedAccessLevel) === 'Project Manager';
        const accessLevel =
          customPerm.accessLevel ||
          req.assignedAccessLevel ||
          (isReqPending(req.status) ? 'Viewer' : 'Editor');

        list.push({
          id: req.id,
          name: req.name,
          email: req.email,
          role: req.requestedRole || 'External Partner (Google SSO)',
          accessLevel,
          canEditProjects: customPerm.canEditProjects ?? (isSuper || isAdmin || isEditor || isPM),
          canEditHours: customPerm.canEditHours ?? true,
          canManageTeam: customPerm.canManageTeam ?? (isSuper || isAdmin),
          canDeleteRecords: customPerm.canDeleteRecords ?? isSuper,
          canExportReports: customPerm.canExportReports ?? true,
          assignedProjectIds: ['all'],
          status: isReqPending(req.status) ? 'Pending Approval' : 'Active',
          lastActive: 'Just registered via Google',
        });
      }
    });

    return list;
  }, [employees, onboardingRequests, permissionsMap]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccessFilter, setSelectedAccessFilter] = useState<string>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('BIM Specialist');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState<AccessLevel>('Editor');

  // Simulation state
  const [simName, setSimName] = useState('Alex Rivera');
  const [simEmail, setSimEmail] = useState('alex.rivera.bim@gmail.com');
  const [simDiscipline, setSimDiscipline] = useState('Structure');
  const [simReason, setSimReason] = useState('Structural LOD 350 model review & clash coordination');

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleUpdateAccessLevel = (userId: string, newLevel: AccessLevel) => {
    const isSuper = newLevel === 'Super Admin';
    const isAdmin = newLevel === 'BIM Admin';
    const isEditor = newLevel === 'Editor';
    const isPM = newLevel === 'Project Manager';
    const isViewer = newLevel === 'Viewer';

    const targetUser = users.find((u) => u.id === userId);
    const targetEmail = targetUser?.email;
    const targetName = targetUser?.name || 'User';

    // 1. Update permissionsMap
    setPermissionsMap((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        accessLevel: newLevel,
        canEditProjects: isSuper || isAdmin || isEditor || isPM,
        canEditHours: true,
        canManageTeam: isSuper || isAdmin,
        canDeleteRecords: isSuper,
        canExportReports: isSuper || isAdmin || isEditor || isPM,
      },
    }));

    if (targetEmail) {
      // 2. Update Employee record
      const matchedEmp = employees.find(
        (e) => e.email.toLowerCase() === targetEmail.toLowerCase()
      );
      if (matchedEmp) {
        updateEmployee(matchedEmp.id, {
          role: isSuper
            ? 'Super Administrator'
            : isAdmin
            ? 'BIM Administrator'
            : isPM
            ? 'Senior BIM Project Manager'
            : isEditor
            ? 'BIM Specialist / Modeler'
            : 'Viewer (Read Only)',
        });
      }

      // 3. Mark Onboarding Request as APPROVED with assigned access level
      setOnboardingRequests((prev) =>
        prev.map((r) => {
          if (r.email.toLowerCase() === targetEmail.toLowerCase() || r.id === userId) {
            return {
              ...r,
              status: 'APPROVED',
              assignedAccessLevel: newLevel,
              assignedRole: isSuper
                ? 'SUPER_ADMIN'
                : isPM
                ? 'PROJECT_MANAGER'
                : isViewer
                ? 'VIEWER'
                : 'EDITOR',
              reviewedBy: `${SUPER_ADMIN_NAME} (Super Admin)`,
              reviewedAt: new Date().toLocaleString([], {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          }
          return r;
        })
      );

      // 4. Record to Audit Log
      addAuditLog({
        action: 'role_changed',
        targetUserEmail: targetEmail,
        targetUserName: targetName,
        performedBy: `${SUPER_ADMIN_NAME} (Super Admin)`,
        details: `Modified access level to [${newLevel}] and synchronized system capabilities for ${targetName}.`,
      });

      // 5. Update session if active
      if (currentUser && currentUser.email.toLowerCase() === targetEmail.toLowerCase()) {
        setCurrentUser({
          ...currentUser,
          accessLevel: newLevel,
          appRole: isSuper
            ? 'SUPER_ADMIN'
            : isPM
            ? 'PROJECT_MANAGER'
            : isViewer
            ? 'VIEWER'
            : 'EDITOR',
          isAdmin: isSuper,
          status: 'APPROVED',
        });
      }
    }

    showNotification(`Updated ${targetName}'s access level to ${newLevel}`);
  };

  const handleTogglePermission = (
    userId: string,
    field: 'canEditProjects' | 'canEditHours' | 'canManageTeam' | 'canExportReports'
  ) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const currentVal = targetUser[field];
    const nextVal = !currentVal;

    setPermissionsMap((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: nextVal,
      },
    }));

    addAuditLog({
      action: 'permission_toggled',
      targetUserEmail: targetUser.email,
      targetUserName: targetUser.name,
      performedBy: `${SUPER_ADMIN_NAME} (Super Admin)`,
      details: `${nextVal ? 'Granted' : 'Revoked'} permission [${field}] for ${targetUser.name} (${targetUser.email}).`,
    });

    showNotification(`Updated ${field} permission for ${targetUser.name}`);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((e) => e.id === userId);
    if (target?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('Cannot delete the primary Super Admin account (sushoovan Das).');
      return;
    }

    if (confirm(`Are you sure you want to remove ${target?.name || 'this member'} from Admin Nexus and revoke access?`)) {
      if (target) {
        deleteEmployee(userId);
        deleteOnboardingRequest(userId);
        setPermissionsMap((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });

        addAuditLog({
          action: 'user_deleted',
          targetUserEmail: target.email,
          targetUserName: target.name,
          performedBy: `${SUPER_ADMIN_NAME} (Super Admin)`,
          details: `Revoked access and removed user profile for ${target.name} (${target.email}).`,
        });

        showNotification('User access revoked and member removed');
      }
    }
  };

  const handlePurgeOtherAccounts = () => {
    if (
      confirm(
        'Are you sure you want to delete all other team members and accounts, leaving ONLY Super Admin sushoovan Das with master privileges?'
      )
    ) {
      employees.forEach((emp) => {
        if (emp.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
          deleteEmployee(emp.id);
        }
      });
      onboardingRequests.forEach((req) => {
        if (req.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
          deleteOnboardingRequest(req.id);
        }
      });
      showNotification('All other team members have been purged. sushoovan Das is now the exclusive Super Admin.');
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newEmp = addEmployee({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole.trim(),
      primaryDiscipline: 'BIM - ACS',
      weeklyCapacityHours: 40,
      status: 'Active',
      activeProjectIds: [projects[0]?.id || 'p1'],
      skills: ['Revit 2026', 'Navisworks Manage', 'Solibri'],
    });

    handleUpdateAccessLevel(newEmp.id, newUserAccessLevel);
    setIsInviteModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    showNotification(`Added ${newEmp.name} to Team Efficiency and Admin Nexus`);
  };

  const handleSimulateRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmail.trim()) return;
    signInWithGoogle({
      googleId: `google_sim_${Date.now()}`,
      email: simEmail.trim().toLowerCase(),
      name: simName.trim(),
      discipline: simDiscipline as any,
      organization: 'External Contractor / Modeling Partner',
      accessReason: simReason.trim(),
    });
    setIsSimulateModalOpen(false);
    setActiveSubTab('pending-onboarding');
    showNotification(`Google access request registered for ${simEmail}`);
  };

  const handleToggleAccessRequest = (
    requestId: string,
    applicantName: string,
    decision: 'accept' | 'reject'
  ) => {
    if (decision === 'accept') {
      const selectedRole = pendingRoleMap[requestId] || 'EDITOR';
      const accessLevel = mapAppRoleToAccessLevel(selectedRole);
      const req = onboardingRequests.find((r) => r.id === requestId);
      const selectedDiscipline =
        pendingDisciplineMap[requestId] ||
        (req?.discipline as Discipline) ||
        (req?.primaryDiscipline as Discipline) ||
        'BIM - ACS';

      approveOnboardingRequest(requestId, selectedRole, accessLevel, selectedDiscipline);
      showNotification(`Access granted for ${applicantName} (${selectedRole} - ${selectedDiscipline})`);
    } else {
      rejectOnboardingRequest(requestId, 'Declined by administrator via interactive toggle.');
      showNotification(`Access declined for ${applicantName} — moved to Rejected Logs`);
    }
  };

  const handleApproveWithRole = (requestId: string, applicantName: string) => {
    const selectedRole = pendingRoleMap[requestId] || 'EDITOR';
    const accessLevel = mapAppRoleToAccessLevel(selectedRole);
    const req = onboardingRequests.find((r) => r.id === requestId);
    const selectedDiscipline =
      pendingDisciplineMap[requestId] ||
      (req?.discipline as Discipline) ||
      (req?.primaryDiscipline as Discipline) ||
      'BIM - ACS';

    approveOnboardingRequest(requestId, selectedRole, accessLevel, selectedDiscipline);
    showNotification(`Approved ${applicantName} as ${selectedRole} [${selectedDiscipline}] (${accessLevel})`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAccess =
      selectedAccessFilter === 'all' || u.accessLevel === selectedAccessFilter;

    return matchesSearch && matchesAccess;
  });

  const pendingRequests = onboardingRequests.filter((r) => isReqPending(r.status));
  const pendingCount = pendingRequests.length;
  const approvedRequests = onboardingRequests.filter(
    (r) => (r.status || '').toUpperCase() === 'APPROVED'
  );
  const rejectedRequests = onboardingRequests.filter(
    (r) => (r.status || '').toUpperCase() === 'REJECTED'
  );

  // Access Review table filter: strictly displays active/pending requests (status === 'Pending')
  const filteredOnboarding = onboardingRequests.filter((r) => {
    if (onboardingFilter === 'approved') return (r.status || '').toUpperCase() === 'APPROVED';
    // Strictly displays active/pending requests
    return isReqPending(r.status);
  });

  const filteredRejectedRequests = rejectedRequests.filter((r) => {
    if (!rejectedSearchQuery.trim()) return true;
    const q = rejectedSearchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.primaryDiscipline || '').toLowerCase().includes(q) ||
      (r.requestedRole || '').toLowerCase().includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.targetUserName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.targetUserEmail.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(auditSearchQuery.toLowerCase());

    const matchesAction =
      auditFilterAction === 'all' || log.action === auditFilterAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Admin Nexus
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  Synced with Team Efficiency ({members.filter(m => m.status === 'Active').length} members)
                </span>
                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('pending-onboarding');
                      setOnboardingFilter('pending');
                    }}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse hover:bg-amber-500/30 transition cursor-pointer flex items-center gap-1"
                    title="Click to open pending access review queue"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{pendingCount} Pending Approvals (Review Queue)</span>
                  </button>
                )}
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Role governance, access request approval gating, and ISO 19650 audit trail for Google Workspace & Gmail sign-ins.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              title="Configure 2FA & Centralized Security Settings"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>2FA & Security Settings</span>
            </button>

            <button
              onClick={handlePurgeOtherAccounts}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 text-xs font-semibold transition"
              title="Delete all other accounts leaving only sushoovan Das as Super Admin"
            >
              <UserX className="w-4 h-4 text-rose-400" />
              <span>Purge Other Accounts</span>
            </button>

            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Simulate External Google Sign-Up</span>
            </button>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Grant Access / Add Member</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 flex-wrap">
          <button
            onClick={() => setActiveSubTab('active-users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'active-users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Active Team & Permissions ({members.filter(m => m.status === 'Active').length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('pending-onboarding');
              setOnboardingFilter('pending');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
              activeSubTab === 'pending-onboarding'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Access Review & Gating ({pendingCount})</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('rejected-logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
              activeSubTab === 'rejected-logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Rejected Logs ({rejectedRequests.length})</span>
            {rejectedRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] flex items-center justify-center">
                {rejectedRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audit-logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'audit-logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Admin Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'active-users' ? (
        <>
          {/* Pending Requests Alert Notification Banner */}
          {pendingCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="font-bold text-amber-200 text-sm">
                    {pendingCount} Access {pendingCount === 1 ? 'Request is' : 'Requests are'} Awaiting Super Admin Review
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    Applicants have submitted access requests from the landing page. Click below to review and approve/reject.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('pending-onboarding');
                  setOnboardingFilter('pending');
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>Review Pending Queue ({pendingCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Control Bar: Search & Filter */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team members by name or Google email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${
                  isLight
                    ? 'bg-slate-100 text-slate-900 border border-slate-200'
                    : 'bg-slate-800 text-slate-100 border border-slate-700'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0">
                Filter Role:
              </span>
              <select
                value={selectedAccessFilter}
                onChange={(e) => setSelectedAccessFilter(e.target.value)}
                className={`text-xs font-medium px-3 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 text-slate-900 border border-slate-200'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                <option value="all">All Roles ({users.length})</option>
                <option value="Super Admin">Super Admin</option>
                <option value="BIM Admin">BIM Admin</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* User Access Table */}
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 min-w-[220px]">User & Identity</th>
                    <th className="py-3 px-3 min-w-[120px]">Account Status</th>
                    <th className="py-3 px-3 min-w-[180px]">Access Level / Role</th>
                    <th className="py-3 px-3 min-w-[100px] text-center">Edit Projects</th>
                    <th className="py-3 px-3 min-w-[100px] text-center">Manage Team</th>
                    <th className="py-3 px-3 min-w-[120px] text-center">Log Daily Hours</th>
                    <th className="py-3 px-4 min-w-[80px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => {
                    const isSuper = user.accessLevel === 'Super Admin';
                    const isAdmin = user.accessLevel === 'BIM Admin';
                    const isEditor = user.accessLevel === 'Editor';
                    const isPM = user.accessLevel === 'Project Manager';
                    const isViewer = user.accessLevel === 'Viewer';
                    const isPending = user.status === 'Pending Approval';

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tracking-wide">
                              {user.name}
                            </span>
                            {isSuper && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                SUPER ADMIN
                              </span>
                            )}
                            {isAdmin && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                BIM ADMIN
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{user.email}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {isPending ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                Pending
                              </span>
                              <div
                                role="group"
                                aria-label="Quick Access Decision Toggle"
                                className="inline-flex items-center p-0.5 rounded-lg bg-slate-950/80 border border-slate-800"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matched = onboardingRequests.find(
                                      (r) => r.email.toLowerCase() === user.email.toLowerCase() || r.id === user.id
                                    );
                                    if (matched) {
                                      handleToggleAccessRequest(matched.id, user.name, 'accept');
                                    } else {
                                      handleUpdateAccessLevel(user.id, user.accessLevel || 'Editor');
                                    }
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-0.5 transition cursor-pointer"
                                  title="Accept Access"
                                >
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matched = onboardingRequests.find(
                                      (r) => r.email.toLowerCase() === user.email.toLowerCase() || r.id === user.id
                                    );
                                    if (matched) {
                                      handleToggleAccessRequest(matched.id, user.name, 'reject');
                                    } else {
                                      deleteEmployee(user.id);
                                      showNotification(`Access declined for ${user.name}`);
                                    }
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 flex items-center gap-0.5 transition cursor-pointer"
                                  title="Reject Access"
                                >
                                  <X className="w-3 h-3 text-rose-400" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              Active Member
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <select
                              value={user.accessLevel}
                              onChange={(e) => handleUpdateAccessLevel(user.id, e.target.value as AccessLevel)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition w-full ${
                                isSuper
                                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                                  : isAdmin
                                  ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                                  : isPM
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                                  : isEditor
                                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              <option value="Super Admin" className="bg-slate-900 text-indigo-300">👑 Super Admin</option>
                              <option value="BIM Admin" className="bg-slate-900 text-blue-300">🛡️ BIM Admin</option>
                              <option value="Project Manager" className="bg-slate-900 text-purple-300">💼 Project Manager</option>
                              <option value="Editor" className="bg-slate-900 text-cyan-300">✏️ Editor (Edit Access)</option>
                              <option value="Viewer" className="bg-slate-900 text-slate-300">👁️ Viewer (Read Only)</option>
                            </select>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              Current Role: {user.role}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleTogglePermission(user.id, 'canEditProjects')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              user.canEditProjects
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {user.canEditProjects ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleTogglePermission(user.id, 'canManageTeam')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              user.canManageTeam
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {user.canManageTeam ? 'Admin' : 'No'}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleTogglePermission(user.id, 'canEditHours')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              user.canEditHours
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {user.canEditHours ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isSuper && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                              title="Revoke Member Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeSubTab === 'pending-onboarding' ? (
        /* GATING & PENDING ONBOARDING WORKFLOW SECTION */
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Access Review & Gating Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review external Gmail & Google Workspace user registrations. Strictly displays active and pending requests.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    onClick={() => setOnboardingFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      onboardingFilter === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pending Queue ({pendingCount})
                  </button>
                  <button
                    onClick={() => setOnboardingFilter('approved')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      onboardingFilter === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Approved History ({approvedRequests.length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('rejected-logs')}
                    className="px-2.5 py-1 rounded-lg font-semibold transition text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Rejected Logs ({rejectedRequests.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fetchPendingRequests()}
                  disabled={isSyncing}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                  title={lastSyncTime ? `Last synced at ${lastSyncTime}` : 'Real-time re-fetch from access_requests database'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
                </button>

                <button
                  onClick={() => setIsSimulateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start shadow-md shadow-blue-600/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Simulate New Sign-Up</span>
                </button>
              </div>
            </div>
          </div>

          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 min-w-[220px]">Applicant & Corporate Email</th>
                    <th className="py-3 px-3 min-w-[140px]">Discipline & Org</th>
                    <th className="py-3 px-3 min-w-[220px]">Reason for Access</th>
                    <th className="py-3 px-3 min-w-[110px] text-center">Status</th>
                    <th className="py-3 px-4 min-w-[280px] text-right">
                      {onboardingFilter === 'approved' ? 'Assigned Role & Actions' : 'Role & Access Decision'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOnboarding.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No requests found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOnboarding.map((req) => {
                      const isPending = isReqPending(req.status);
                      const isApproved = req.status.toUpperCase() === 'APPROVED' || req.status.toLowerCase() === 'approved';
                      const isRejected = req.status.toUpperCase() === 'REJECTED' || req.status.toLowerCase() === 'rejected';

                      return (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-[13px]">{req.fullName || req.name}</div>
                            <div className="font-mono text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{req.email}</span>
                            </div>
                            <div className="text-[10px] text-blue-400 font-medium mt-0.5">
                              Requested: {req.requestedRole}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-medium block w-fit">
                              {req.discipline || req.primaryDiscipline || 'BIM - ACS'}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {req.organization || req.discipline || 'Partner Division'}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <p className="text-slate-300 text-xs italic line-clamp-2 max-w-xs">
                              "{req.reasonForAccess || req.accessReason || req.notes || 'Sign-in Access Request'}"
                            </p>
                            <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                              Submitted: {req.createdAt || req.requestTimestamp || req.requestedAt}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                Pending Review
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <Check className="w-3 h-3" />
                                Approved ({req.assignedRole || req.assignedAccessLevel || 'Editor'})
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <X className="w-3 h-3" />
                                Declined
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Role selector dropdown */}
                              <select
                                value={
                                  pendingRoleMap[req.id] ||
                                  (req.assignedRole as UserRole) ||
                                  'EDITOR'
                                }
                                onChange={(e) => {
                                  const newRole = e.target.value as UserRole;
                                  setPendingRoleMap((prev) => ({
                                    ...prev,
                                    [req.id]: newRole,
                                  }));
                                  if (isApproved) {
                                    const accessLevel = mapAppRoleToAccessLevel(newRole);
                                    const currentDiscipline =
                                      pendingDisciplineMap[req.id] ||
                                      (req.discipline as Discipline) ||
                                      (req.primaryDiscipline as Discipline) ||
                                      'BIM - ACS';
                                    approveOnboardingRequest(req.id, newRole, accessLevel, currentDiscipline);
                                    showNotification(`Updated ${req.name}'s role to ${newRole}`);
                                  }
                                }}
                                disabled={isRejected}
                                className={`text-[11px] font-semibold px-2 py-1.5 rounded-xl border transition cursor-pointer ${
                                  isRejected
                                    ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-slate-800 border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500'
                                }`}
                                title={isApproved ? 'Change assigned role' : 'Role to assign upon acceptance'}
                              >
                                <option value="SUPER_ADMIN">Role: Super Admin</option>
                                <option value="PROJECT_MANAGER">Role: Project Manager</option>
                                <option value="EDITOR">Role: Editor</option>
                                <option value="VIEWER">Role: Viewer (Read-only)</option>
                              </select>

                              {/* Discipline selector dropdown */}
                              <select
                                value={
                                  pendingDisciplineMap[req.id] ||
                                  (req.discipline as Discipline) ||
                                  (req.primaryDiscipline as Discipline) ||
                                  'BIM - ACS'
                                }
                                onChange={(e) => {
                                  const newDiscipline = e.target.value as Discipline;
                                  setPendingDisciplineMap((prev) => ({
                                    ...prev,
                                    [req.id]: newDiscipline,
                                  }));
                                  if (isApproved) {
                                    const currentRole = pendingRoleMap[req.id] || (req.assignedRole as UserRole) || 'EDITOR';
                                    const accessLevel = mapAppRoleToAccessLevel(currentRole);
                                    approveOnboardingRequest(req.id, currentRole, accessLevel, newDiscipline);
                                    showNotification(`Updated ${req.name}'s discipline to ${newDiscipline}`);
                                  }
                                }}
                                disabled={isRejected}
                                className={`text-[11px] font-semibold px-2 py-1.5 rounded-xl border transition cursor-pointer ${
                                  isRejected
                                    ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-slate-800 border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500'
                                }`}
                                title={isApproved ? 'Change assigned discipline' : 'Discipline to assign upon acceptance'}
                              >
                                {PRIMARY_DISCIPLINES.map((d) => (
                                  <option key={d} value={d}>
                                    Discipline: {d}
                                  </option>
                                ))}
                              </select>

                              {/* Decision Actions: ONLY shown for Pending requests, NOT in approved history */}
                              {isPending && (
                                <div
                                  role="group"
                                  aria-label="Access Decision Actions"
                                  className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner"
                                >
                                  {/* Accept Action */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAccessRequest(req.id, req.name, 'accept')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-sm transition-all cursor-pointer active:scale-95"
                                    title="Accept & Grant Access"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Accept</span>
                                  </button>

                                  {/* Reject Action */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAccessRequest(req.id, req.name, 'reject')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                                    title="Reject & Decline Request"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              )}

                              {/* Approved History: Active status badge & Revoke option instead of toggle keys */}
                              {isApproved && (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Access Active</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      rejectOnboardingRequest(req.id, 'Access revoked from Approved History by Super Admin.');
                                      showNotification(`Revoked access for ${req.name} — moved to Rejected Logs`);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer"
                                    title="Revoke member access"
                                  >
                                    Revoke
                                  </button>
                                </>
                              )}

                              {/* Delete Request Record */}
                              <button
                                onClick={() => {
                                  deleteOnboardingRequest(req.id);
                                  showNotification(`Removed request record for ${req.email}`);
                                }}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                                title="Delete Request Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'rejected-logs' ? (
        /* REJECTED & ARCHIVED LOGS VIEW */
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className={`p-5 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Archived & Rejected Access Logs ({rejectedRequests.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical log of rejected Google OAuth and external onboarding requests. Access is blocked across all BPMS workspaces.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search rejected requests..."
                    value={rejectedSearchQuery}
                    onChange={(e) => setRejectedSearchQuery(e.target.value)}
                    className="text-xs font-medium pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 min-w-[220px]">Applicant & Corporate Email</th>
                    <th className="py-3 px-3 min-w-[140px]">Discipline & Org</th>
                    <th className="py-3 px-3 min-w-[220px]">Original Reason & Submission</th>
                    <th className="py-3 px-3 min-w-[140px] text-center">Status</th>
                    <th className="py-3 px-4 min-w-[200px] text-right">Archived Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRejectedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto text-center space-y-1">
                          <XCircle className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs font-semibold text-slate-300">No Rejected Requests Found</p>
                          <p className="text-[11px] text-slate-500">
                            When access requests are declined in the Access Review table, they are removed from the active queue and archived here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRejectedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-[13px]">{req.name}</div>
                          <div className="font-mono text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{req.email}</span>
                          </div>
                          <div className="text-[10px] text-rose-400 font-medium mt-0.5">
                            Requested: {req.requestedRole}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-medium block w-fit">
                            {req.primaryDiscipline || 'BIM - ACS'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {req.organization || 'External Partner'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <p className="text-slate-300 text-xs italic line-clamp-2 max-w-xs">
                            "{req.accessReason || req.notes || 'BIM review'}"
                          </p>
                          <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                            Declined: {req.reviewedAt || req.requestTimestamp}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <X className="w-3 h-3" />
                            Declined & Archived
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                reopenOnboardingRequest(req.id);
                                showNotification(`Re-opened request for ${req.name} — restored to Pending Queue`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 transition cursor-pointer"
                              title="Reconsider and restore to Pending Queue"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Re-open</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                deleteOnboardingRequest(req.id);
                                showNotification(`Permanently removed archived request for ${req.email}`);
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* AUDIT TRAIL LOGS VIEW */
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Administrative Audit Logs & Governance History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immutable real-time audit record of all Google Workspace SSO sign-ins, access approvals, role adjustments, and security revocations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={auditFilterAction}
                  onChange={(e) => setAuditFilterAction(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Actions</option>
                  <option value="joined">Google SSO Joined</option>
                  <option value="approved">Approved</option>
                  <option value="role_changed">Role / Access Changed</option>
                  <option value="permission_toggled">Permission Toggled</option>
                  <option value="rejected">Rejected</option>
                  <option value="user_deleted">Revoked</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 min-w-[140px]">Action & Event</th>
                    <th className="py-3 px-3 min-w-[180px]">Target User</th>
                    <th className="py-3 px-3 min-w-[240px]">Details & Scope</th>
                    <th className="py-3 px-3 min-w-[160px]">Admin Actor</th>
                    <th className="py-3 px-4 min-w-[140px] text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No audit records match the current search query.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const isApproved = log.action === 'approved';
                      const isRejected = log.action === 'rejected';
                      const isDeleted = log.action === 'user_deleted';
                      const isRoleChanged = log.action === 'role_changed' || log.action === 'access_level_changed';
                      const isPermToggled = log.action === 'permission_toggled' || log.action === 'permission_changed';
                      const isJoined = log.action === 'joined' || log.action === 'user_joined' || log.action === 'access_requested';

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            {isJoined && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                <Sparkles className="w-3 h-3 text-cyan-400" />
                                Google SSO Join
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Access Approved
                              </span>
                            )}
                            {isRoleChanged && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                Role Changed
                              </span>
                            )}
                            {isPermToggled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                <SlidersHorizontal className="w-3 h-3" />
                                Permission Toggled
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <XCircle className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                            {isDeleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                <UserX className="w-3 h-3" />
                                Revoked
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{log.targetUserName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{log.targetUserEmail}</div>
                          </td>

                          <td className="py-3 px-3 text-slate-200">
                            {log.details}
                          </td>

                          <td className="py-3 px-3 text-indigo-300 font-medium">
                            {log.performedBy}
                          </td>

                          <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                            {log.timestamp}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Grant Access / Add Member</h3>
                  <p className="text-xs text-slate-400">Directly adds member to Team Efficiency & Admin Nexus</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jason Thorne"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="j.thorne@productionpulse.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Access Level
                  </label>
                  <select
                    value={newUserAccessLevel}
                    onChange={(e) => setNewUserAccessLevel(e.target.value as AccessLevel)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="BIM Admin">BIM Admin</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Editor">Editor (Edit Access)</option>
                    <option value="Viewer">Viewer (Read Only)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
                >
                  Confirm & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate Onboarding Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Simulate Registration</h3>
                  <p className="text-xs text-slate-400">Creates a pending request in Admin Nexus</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateRegistration} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google (Gmail) Account
                </label>
                <input
                  type="email"
                  required
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    BIM Discipline
                  </label>
                  <select
                    value={simDiscipline}
                    onChange={(e) => setSimDiscipline(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Architecture">Architecture</option>
                    <option value="Structure">Structure</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Fire Protection">Fire Protection</option>
                    <option value="Civil / Site">Civil / Site</option>
                    <option value="Coordination">Coordination</option>
                    <option value="AI & Automation">AI & Automation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Requested Access
                  </label>
                  <input
                    type="text"
                    required
                    value={simReason}
                    onChange={(e) => setSimReason(e.target.value)}
                    placeholder="e.g. Model validation"
                    className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md"
                >
                  Submit Simulated Sign-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security & 2FA Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};