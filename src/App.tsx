import React, { useState, useEffect, useCallback } from 'react';
import {
  BimDataProvider,
  useBimData,
} from './context/BimDataContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { SidebarNav } from './components/SidebarNav';
import { GlobalSecurityBar } from './components/GlobalSecurityBar';
import { DashboardOverview } from './components/DashboardOverview';
import { ProjectList } from './components/ProjectList';
import { DailyHourTracker } from './components/DailyHourTracker';
import { ProjectMemberTracking } from './components/ProjectMemberTracking';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import { AssignHoursSystem } from './components/AssignHoursSystem';
import { ProjectFeedback } from './components/ProjectFeedback';
import { ClashAndLODTracker } from './components/ClashAndLODTracker';
import { StakeholderReportsArchive } from './components/StakeholderReportsArchive';
import { AdminNexus } from './components/AdminNexus';
import { StakeholderReportModal } from './components/StakeholderReportModal';
import { LogTimeModal } from './components/LogTimeModal';
import { NewProjectModal } from './components/NewProjectModal';
import { NewEmployeeModal } from './components/NewEmployeeModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { SignInModal } from './components/SignInModal';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { AuthGateway } from './components/AuthGateway';
import { TwoFactorChallengeModal } from './components/TwoFactorChallengeModal';
import { PublicClientFeedback } from './components/PublicClientFeedback';
import { BimProject, ViewTab } from './types';

export const ROUTE_TAB_MAP: Record<string, ViewTab> = {
  '/dashboard': 'dashboard',
  '/projects': 'projects',
  '/daily-tracker': 'daily-tracker',
  '/project-members': 'project-members',
  '/employees': 'employees',
  '/assign-hours': 'assign-hours',
  '/clash-lod': 'assign-hours',
  '/project-feedback': 'project-feedback',
  '/stakeholder-reports': 'stakeholder-reports',
  '/admin-nexus': 'admin-nexus',
};

export const TAB_ROUTE_MAP: Record<ViewTab, string> = {
  'dashboard': '/dashboard',
  'projects': '/projects',
  'daily-tracker': '/daily-tracker',
  'project-members': '/project-members',
  'employees': '/employees',
  'assign-hours': '/assign-hours',
  'clash-lod': '/assign-hours',
  'project-feedback': '/project-feedback',
  'stakeholder-reports': '/stakeholder-reports',
  'admin-nexus': '/admin-nexus',
};

export function isFeedbackRoute(path?: string): boolean {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname || '';
    if (pathname === '/feedback' || pathname.startsWith('/feedback')) {
      return true;
    }
    const hash = window.location.hash || '';
    if (
      hash === '#feedback' ||
      hash === '#/feedback' ||
      hash.startsWith('#feedback') ||
      hash.startsWith('#/feedback')
    ) {
      return true;
    }
  }
  if (!path) return false;
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean === '/feedback' || clean.startsWith('/feedback');
}

function getNormalizedPath(): string {
  if (typeof window === 'undefined') return '/';
  // Check if current route is public feedback portal
  if (isFeedbackRoute()) return '/feedback';

  // Check hash first (e.g. #/dashboard or #dashboard or #feedback)
  const hash = window.location.hash.replace(/^#\/?/, '/');
  if (isFeedbackRoute(hash)) return '/feedback';
  if (hash && hash !== '/' && ROUTE_TAB_MAP[hash]) {
    return hash;
  }
  const pathname = window.location.pathname;
  if (!pathname || pathname === '' || pathname === '/') return '/';
  if (isFeedbackRoute(pathname)) return '/feedback';
  const clean = pathname.replace(/\/+$/, '');
  return clean || '/';
}

function BimAppContent() {
  const { currentTab, setCurrentTab, theme, currentUser } = useBimData();
  const { isAuthenticated, is2FAPending, securityRole } = useAuth();
  const isLight = theme === 'light';

  const isSuperAdmin =
    securityRole === 'Super Admin' ||
    currentUser?.isAdmin ||
    currentUser?.appRole === 'SUPER_ADMIN' ||
    currentUser?.accessLevel === 'Super Admin' ||
    (currentUser?.email && (
      currentUser.email.toLowerCase() === 'modelatech2026@gmail.com' ||
      currentUser.email.toLowerCase() === 'sushoovandas@gmail.com'
    ));

  const isViewer =
    securityRole === 'Viewer' ||
    currentUser?.appRole === 'VIEWER' ||
    (currentUser?.accessLevel === 'Viewer' && !isSuperAdmin);

  // Active Browser Route State
  const [currentPath, setCurrentPath] = useState<string>(() => getNormalizedPath());

  // Check if session is truly active and approved
  const hasActiveSession = Boolean(
    isAuthenticated &&
    currentUser &&
    (currentUser.status === 'APPROVED' || currentUser.status === 'active')
  );

  // 1. Automatic Unauthenticated Redirect:
  // If an unauthenticated user opens any direct dashboard link (e.g. /dashboard, /projects, /admin-nexus),
  // immediately store the attempted target and redirect to the Landing / Sign-In page (/)
  // Auth Guard Exemption: If window.location.pathname === '/feedback' (or starts with '/feedback'), DO NOT redirect!
  useEffect(() => {
    // Check if requested route is public feedback
    if (isFeedbackRoute() || isFeedbackRoute(currentPath)) {
      return;
    }

    if (!hasActiveSession) {
      const path = getNormalizedPath();
      if (path !== '/' && path !== '/login' && !isFeedbackRoute(path)) {
        try {
          sessionStorage.setItem('bpms_redirect_target', path);
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/');
        }
        setCurrentPath('/');
      }
    }
  }, [hasActiveSession, currentPath]);

  // Synchronize browser popstate & hashchange events
  useEffect(() => {
    const handleLocationChange = () => {
      const path = getNormalizedPath();
      setCurrentPath(path);
      if (ROUTE_TAB_MAP[path]) {
        setCurrentTab(ROUTE_TAB_MAP[path]);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [setCurrentTab]);

  // Sync initial path with ViewTab if authenticated
  useEffect(() => {
    if (hasActiveSession) {
      const path = getNormalizedPath();
      if (ROUTE_TAB_MAP[path]) {
        setCurrentTab(ROUTE_TAB_MAP[path]);
      }
    }
  }, [hasActiveSession, setCurrentTab]);

  // Automatically enforce viewer view tab constraint
  useEffect(() => {
    if (isViewer && currentTab !== 'daily-tracker') {
      setCurrentTab('daily-tracker');
      if (typeof window !== 'undefined' && currentPath !== '/' && currentPath !== '/daily-tracker') {
        window.history.replaceState(null, '', '/daily-tracker');
        setCurrentPath('/daily-tracker');
      }
    }
  }, [isViewer, currentTab, setCurrentTab, currentPath]);

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalProjectId, setReportModalProjectId] = useState<string | undefined>();

  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
  const [logTimeModalProjectId, setLogTimeModalProjectId] = useState<string | undefined>();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<BimProject | null>(null);

  /**
   * Router navigation helper
   */
  const navigateTo = useCallback(
    (targetPath: string) => {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', targetPath);
      }
      setCurrentPath(targetPath);
      if (ROUTE_TAB_MAP[targetPath]) {
        setCurrentTab(ROUTE_TAB_MAP[targetPath]);
      }
    },
    [setCurrentTab]
  );

  /**
   * Handle Tab change from sidebar or headers
   */
  const handleTabChange = useCallback(
    (tabId: ViewTab) => {
      const targetRoute = TAB_ROUTE_MAP[tabId] || '/dashboard';
      navigateTo(targetRoute);
    },
    [navigateTo]
  );

  /**
   * Post-Login Routing:
   * Only redirect users to the dashboard *after* they have successfully submitted their login credentials
   */
  const handlePostLoginRouting = useCallback(
    (explicitTarget?: string) => {
      let target = explicitTarget;
      if (!target) {
        try {
          target = sessionStorage.getItem('bpms_redirect_target') || '/dashboard';
          sessionStorage.removeItem('bpms_redirect_target');
        } catch {
          target = '/dashboard';
        }
      }

      // Restrict viewer to daily-tracker
      if (isViewer && target !== '/daily-tracker') {
        target = '/daily-tracker';
      }

      navigateTo(target);
    },
    [isViewer, navigateTo]
  );

  // Retrieve any pending attempted route for display on login screen
  const attemptedRoute = (() => {
    try {
      return sessionStorage.getItem('bpms_redirect_target');
    } catch {
      return null;
    }
  })();

  // 0. Auth Guard Exemption Logic: Public Client Route (/feedback)
  // Check if window.location.pathname === '/feedback' (or starts with '/feedback')
  // Bypass Auth Check: If the requested route is /feedback, DO NOT redirect to the login/landing screen even if isAuthenticated is false.
  // Render ONLY the standalone view matching exact layout (stripped of sidebar, navbar, and cancel buttons)
  const isPublicFeedback =
    (typeof window !== 'undefined' &&
      (window.location.pathname === '/feedback' ||
        window.location.pathname.startsWith('/feedback'))) ||
    isFeedbackRoute(currentPath) ||
    isFeedbackRoute();

  if (isPublicFeedback) {
    return <PublicClientFeedback />;
  }

  // 1. Two-Factor Authentication Login Challenge Step: If 2FA is pending, prompt challenge
  if (is2FAPending) {
    return (
      <TwoFactorChallengeModal
        onSuccess={() => handlePostLoginRouting()}
      />
    );
  }

  // 2. Session Gate / Auth Guard:
  // If user has NO active session, always load the Landing Page / Sign-In screen
  if (!hasActiveSession) {
    return (
      <AuthGateway
        onLoginSuccess={handlePostLoginRouting}
        attemptedRoute={attemptedRoute}
      />
    );
  }

  // 3. Pending Approval, Rejected, or Suspended: Render dedicated Access Request Status Screen
  if (
    currentUser &&
    (currentUser.status === 'pending_approval' ||
      currentUser.status === 'pending' ||
      currentUser.status === 'rejected' ||
      currentUser.status === 'suspended')
  ) {
    return <PendingApprovalScreen />;
  }

  // 4. Default Entry Point (/):
  // When user visits the root URL (/), render the Landing Page / Sign-In screen by default.
  // If they already have an active session, they see the active session welcome card with "Enter Dashboard".
  if (currentPath === '/' || currentPath === '/login') {
    return (
      <AuthGateway
        hasActiveSession={true}
        onEnterDashboard={() => navigateTo(isViewer ? '/daily-tracker' : '/dashboard')}
        onLoginSuccess={handlePostLoginRouting}
      />
    );
  }

  const handleOpenReportModal = (projectId?: string) => {
    setReportModalProjectId(projectId);
    setIsReportModalOpen(true);
  };

  const handleOpenLogModal = (projectId?: string) => {
    setLogTimeModalProjectId(projectId);
    setIsLogTimeModalOpen(true);
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Left-Hand Side Ribbon / Sidebar Navigation */}
      <SidebarNav
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        onOpenLogModal={() => handleOpenLogModal()}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onOpenNewEmployeeModal={() => setIsNewEmployeeModalOpen(true)}
        onOpenReportModal={() => handleOpenReportModal()}
        onOpenSignInModal={() => setIsSignInModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Global Security Header / Active Role Bar */}
        <GlobalSecurityBar
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          onOpenNewEmployeeModal={() => setIsNewEmployeeModalOpen(true)}
          onOpenLogModal={() => handleOpenLogModal()}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isViewer ? (
            <DailyHourTracker onOpenLogModal={() => handleOpenLogModal()} />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardOverview
                  onOpenReportModal={handleOpenReportModal}
                  onOpenLogModal={() => handleOpenLogModal()}
                  onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
                />
              )}

              {currentTab === 'projects' && (
                <ProjectList
                  onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
                  onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                  onOpenReportModalWithProject={(id) => handleOpenReportModal(id)}
                />
              )}

              {currentTab === 'daily-tracker' && (
                <DailyHourTracker onOpenLogModal={() => handleOpenLogModal()} />
              )}

              {currentTab === 'project-members' && (
                <ProjectMemberTracking
                  onOpenNewEmployeeModal={() => setIsNewEmployeeModalOpen(true)}
                  onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                  onOpenLogModalForMember={(empId) => handleOpenLogModal()}
                  onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
                />
              )}

              {currentTab === 'employees' && (
                <EmployeeDirectory
                  onOpenNewEmployeeModal={() => setIsNewEmployeeModalOpen(true)}
                  onOpenLogModalForEmployee={(empId) => handleOpenLogModal()}
                />
              )}

              {(currentTab === 'assign-hours' || currentTab === 'clash-lod') && (
                <AssignHoursSystem
                  onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
                />
              )}

              {currentTab === 'project-feedback' && (
                <ProjectFeedback
                  onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
                />
              )}

              {currentTab === 'stakeholder-reports' && (
                <StakeholderReportsArchive
                  onOpenReportModal={() => handleOpenReportModal()}
                />
              )}

              {currentTab === 'admin-nexus' && <AdminNexus />}
            </>
          )}
        </main>

        {/* Global Footer */}
        <footer
          className={`border-t py-5 text-center text-xs transition-colors mt-auto ${
            isLight
              ? 'bg-white border-slate-200 text-slate-500'
              : 'border-slate-900 bg-slate-950 text-slate-500'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                Production Pulse v2.6
              </span>
              <span>• ISO 19650 Compliance Enabled</span>
            </div>
            <div>
              Real-time BIM Project Hours, Team Member Tracking & Multi-Trade LOD Coordination
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <StakeholderReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        preselectedProjectId={reportModalProjectId}
      />

      <LogTimeModal
        isOpen={isLogTimeModalOpen}
        onClose={() => setIsLogTimeModalOpen(false)}
        preselectedProjectId={logTimeModalProjectId}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />

      <NewEmployeeModal
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
      />

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      <ProjectDetailModal
        project={selectedProjectForDetail}
        onClose={() => setSelectedProjectForDetail(null)}
        onOpenReportModalWithProject={(id) => {
          setSelectedProjectForDetail(null);
          handleOpenReportModal(id);
        }}
        onOpenLogModalWithProject={(id) => {
          setSelectedProjectForDetail(null);
          handleOpenLogModal(id);
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BimDataProvider>
        <BimAppContent />
      </BimDataProvider>
    </AuthProvider>
  );
}

export default App;
