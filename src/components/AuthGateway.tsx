import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useBimData } from '../context/BimDataContext';
import {
  Building2,
  ShieldCheck,
  RefreshCw,
  Mail,
  User,
  X,
  AlertTriangle,
} from 'lucide-react';
import { TwoFactorChallengeModal } from './TwoFactorChallengeModal';
import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { isSuperAdminEmail, SUPER_ADMIN_NAME } from '../auth/googleAuth';

interface AuthGatewayProps {
  isModal?: boolean;
  onClose?: () => void;
  initialMode?: string;
  onLoginSuccess?: (targetRoute?: string) => void;
  onEnterDashboard?: () => void;
  hasActiveSession?: boolean;
  attemptedRoute?: string | null;
}

interface SubmittedRequestData {
  name: string;
  email: string;
  uid: string;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  isModal = false,
  onClose,
  onLoginSuccess,
  onEnterDashboard,
  hasActiveSession = false,
  attemptedRoute = null,
}) => {
  const {
    is2FAPending,
    submitAccessRequest,
    loginWithEmail,
    updateCurrentUser,
  } = useAuth();

  const { currentUser, registerAccessRequest } = useBimData();

  // View state: 'form' | 'pending'
  const [viewStep, setViewStep] = useState<'form' | 'pending'>('form');

  // Form Fields matching exact visual design in image.png
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inputErrors, setInputErrors] = useState<{ name?: string; email?: string }>({});

  const [submittedRecord, setSubmittedRecord] = useState<SubmittedRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active user reference for real-time pending listener
  const activeUser = submittedRecord || (currentUser?.email ? {
    name: currentUser.name,
    email: currentUser.email,
    uid: currentUser.googleId || currentUser.id,
  } : null);

  // Real-time Firestore listener when in pending approval step
  useEffect(() => {
    if (viewStep !== 'pending' || !activeUser?.uid) return;

    let unsubscribe: (() => void) | undefined;
    try {
      const docRef = doc(db, 'access_requests', activeUser.uid);
      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const firestoreStatus = (data?.status || '').toLowerCase();
            if (firestoreStatus === 'approved') {
              setTimeout(() => {
                updateCurrentUser({
                  status: 'APPROVED',
                  accessLevel: 'Editor',
                  role: data?.role || 'BIM Specialist / Editor',
                  name: data?.name || activeUser.name,
                });
                if (onLoginSuccess) {
                  onLoginSuccess(attemptedRoute || '/dashboard');
                } else if (onClose) {
                  onClose();
                }
              }, 400);
            }
          }
        },
        (err) => {
          console.warn('Real-time access request listener notice:', err);
        }
      );
    } catch (err) {
      console.warn('Error establishing Firestore listener:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [viewStep, activeUser?.uid, updateCurrentUser, onLoginSuccess, attemptedRoute, onClose]);

  // If 2FA challenge is currently pending, show 2FA challenge modal
  if (is2FAPending) {
    return (
      <TwoFactorChallengeModal
        onSuccess={() => {
          if (onLoginSuccess) {
            onLoginSuccess(attemptedRoute || '/dashboard');
          } else if (onClose) {
            onClose();
          }
        }}
        onCancel={() => {
          setErrorMessage(null);
        }}
        isStandaloneScreen={!isModal}
      />
    );
  }

  const isValidEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());

  /**
   * Handle Submit Request
   */
  const handleSubmitRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    const errors: { name?: string; email?: string } = {};
    if (!cleanName) {
      errors.name = 'Please enter your Full Name.';
    } else if (cleanName.length < 2) {
      errors.name = 'Full Name must be at least 2 characters.';
    }

    if (!cleanEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!isValidEmail(cleanEmail)) {
      errors.email = 'Please provide a valid email format (e.g. name@example.com).';
    }

    if (Object.keys(errors).length > 0) {
      setInputErrors(errors);
      return;
    }

    setInputErrors({});
    setIsLoading(true);
    setErrorMessage(null);

    const safePrefix = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 35);
    const hash = Math.abs(
      cleanEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    );
    const generatedUid = `req_${safePrefix}_${hash}`;
    const isoTimestamp = new Date().toISOString();

    const userDiscipline = 'BIM - ACS';
    const userReason = 'Sign-in Access Request for ProductionPulse BPMS';

    try {
      const isWhitelistedSuperAdmin = isSuperAdminEmail(cleanEmail);

      // 1. Automatically verify whitelisted Super Admin emails and grant access through trusted authorization checks
      if (isWhitelistedSuperAdmin) {
        // Trusted server-side authorization check
        try {
          const verifyRes = await fetch('/api/verify-super-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success || !verifyData.isSuperAdmin) {
            setIsLoading(false);
            setErrorMessage('Authorization check failed: Email is not authorized for Super Admin privileges.');
            return;
          }
        } catch (verifyErr: any) {
          console.error('Server verification check failed:', verifyErr);
          setIsLoading(false);
          setErrorMessage('Network error: Unable to verify administrator authorization with server.');
          return;
        }

        const targetDocId = `req_${safePrefix}_${hash}`;
        const adminPayload = {
          fullName: cleanName || SUPER_ADMIN_NAME,
          name: cleanName || SUPER_ADMIN_NAME,
          applicant_email: cleanEmail,
          email: cleanEmail,
          discipline: 'BPMS Core Systems & Architecture',
          reasonForAccess: 'Executive Super Administrator with master editing and governance access',
          status: 'approved',
          role: 'SUPER_ADMIN',
          requestedRole: 'Super Admin',
          submittedAt: isoTimestamp,
          createdAt: isoTimestamp,
          requestedAt: isoTimestamp,
          timestamp: isoTimestamp,
          id: targetDocId,
          uid: targetDocId,
        };

        try {
          await setDoc(doc(db, 'access_requests', targetDocId), adminPayload, { merge: true });
        } catch (fsAdminErr: any) {
          console.warn('Firestore admin doc write notice:', fsAdminErr);
          // Non-blocking: Server verification has authorized the Super Admin.
          // Proceed with session establishment without blocking authorized access.
        }

        // Notify server database
        try {
          await fetch('/api/access-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: cleanName || SUPER_ADMIN_NAME,
              applicantEmail: cleanEmail,
              discipline: 'BPMS Core Systems & Architecture',
              reasonForAccess: 'Executive Super Administrator with master governance access',
            }),
          });
        } catch (serverErr) {
          console.warn('Server access-request sync notice:', serverErr);
        }

        // Submit through central auth to establish active approved session
        await submitAccessRequest({
          name: cleanName || SUPER_ADMIN_NAME,
          email: cleanEmail,
          uid: targetDocId,
        });

        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(attemptedRoute || '/dashboard');
        } else if (onClose) {
          onClose();
        }
        return;
      }

      // 2. Check existing request using normalized, case-insensitive email to prevent duplicates
      let existingData: any = null;
      let existingDocId: string | null = null;

      try {
        const q = query(collection(db, 'access_requests'), where('applicant_email', '==', cleanEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          existingData = querySnapshot.docs[0].data();
          existingDocId = querySnapshot.docs[0].id;
        } else {
          // Compatibility query for records saved under 'email'
          const qEmail = query(collection(db, 'access_requests'), where('email', '==', cleanEmail));
          const querySnapshotEmail = await getDocs(qEmail);
          if (!querySnapshotEmail.empty) {
            existingData = querySnapshotEmail.docs[0].data();
            existingDocId = querySnapshotEmail.docs[0].id;
          }
        }
      } catch (queryErr: any) {
        console.warn('Firestore query notice:', queryErr);
        // Resilient fallback: Allow submission to proceed through server API and central auth
      }

      // 3. Handle existing request to prevent duplicate submissions
      if (existingData) {
        const status = (existingData.status || '').toLowerCase();
        const existingName = existingData.fullName || existingData.name || cleanName;
        const targetDocId = existingDocId || generatedUid;

        if (status === 'pending') {
          // Duplicate request prevented; retain pending view
          setSubmittedRecord({
            name: existingName,
            email: cleanEmail,
            uid: targetDocId,
          });
          setIsLoading(false);
          setViewStep('pending');
          return;
        } else if (status === 'approved') {
          updateCurrentUser({
            status: 'APPROVED',
            accessLevel: 'Editor',
            role: existingData.role || 'BIM Modeler / Editor',
            name: existingName,
          });
          setIsLoading(false);
          if (onLoginSuccess) {
            onLoginSuccess(attemptedRoute || '/dashboard');
          } else if (onClose) {
            onClose();
          }
          return;
        } else if (status === 'rejected') {
          setIsLoading(false);
          setErrorMessage('❌ Access request was declined. Please contact support.');
          return;
        }
      }

      // 4. Create new request for standard users (Strictly USER role with pending status)
      const requestPayload = {
        fullName: cleanName,
        applicant_email: cleanEmail,
        email: cleanEmail,
        discipline: userDiscipline,
        reasonForAccess: userReason,
        status: 'pending',
        submittedAt: isoTimestamp,
        createdAt: isoTimestamp,
        name: cleanName,
        id: generatedUid,
        uid: generatedUid,
        role: 'USER',
        requestedRole: 'BIM Modeler / Editor',
        primaryDiscipline: userDiscipline,
        organization: userDiscipline,
        accessReason: userReason,
        requestedAt: isoTimestamp,
        timestamp: isoTimestamp,
        requestTimestamp: isoTimestamp,
        notes: userReason,
      };

      try {
        const reqDoc = doc(db, 'access_requests', generatedUid);
        await setDoc(reqDoc, requestPayload, { merge: true });
      } catch (createErr: any) {
        console.warn('Firestore create request notice:', createErr);
      }

      // Sync to server database
      try {
        await fetch('/api/access-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: cleanName,
            applicantEmail: cleanEmail,
            discipline: userDiscipline,
            reasonForAccess: userReason,
            requestedRole: 'USER',
          }),
        });
      } catch (serverErr) {
        console.warn('Server sync notice:', serverErr);
      }

      // Register in memory contexts
      await registerAccessRequest({
        name: cleanName,
        fullName: cleanName,
        email: cleanEmail,
        discipline: userDiscipline,
        reasonForAccess: userReason,
        uid: generatedUid,
        organization: userDiscipline,
        accessReason: userReason,
      });

      // Submit through AuthContext
      await submitAccessRequest({
        name: cleanName,
        email: cleanEmail,
        uid: generatedUid,
      });

      const record: SubmittedRequestData = {
        name: cleanName,
        email: cleanEmail,
        uid: generatedUid,
      };
      setSubmittedRecord(record);
      setIsLoading(false);
      setViewStep('pending');
    } catch (error: any) {
      console.error('Error submitting access request:', error);
      setIsLoading(false);
      if (error?.code === 'permission-denied') {
        setErrorMessage('Access denied: You do not have permissions to submit access requests.');
      } else if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
        setErrorMessage('Network error: Please verify your connection and try again.');
      } else {
        setErrorMessage(
          'Failed to submit request: ' + (error?.message || 'Please try again later.')
        );
      }
    }
  };

  /**
   * Secondary "Back" link handler
   */
  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (viewStep === 'pending') {
      setViewStep('form');
      setSubmittedRecord(null);
      setErrorMessage(null);
      return;
    }

    if (isModal && onClose) {
      onClose();
      return;
    }

    // Reset input fields
    setFullName('');
    setEmail('');
    setInputErrors({});
    setErrorMessage(null);

    if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
      window.history.back();
    }
  };

  /**
   * Render the Form matching exact UI specification in image.png
   */
  const renderFormView = () => (
    <form onSubmit={handleSubmitRequest} className="space-y-5 my-1">
      {/* Field 1: Full Name */}
      <div className="space-y-2">
        <label htmlFor="bpms-full-name" className="block text-sm font-medium text-slate-300">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <User className="w-4 h-4" />
          </div>
          <input
            id="bpms-full-name"
            type="text"
            autoComplete="name"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (inputErrors.name) {
                setInputErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#090f1d] border text-sm text-slate-100 placeholder-slate-500 font-normal focus:outline-none transition ${
              inputErrors.name
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40'
                : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'
            }`}
          />
        </div>
        {inputErrors.name && (
          <p className="text-[11px] text-rose-400 font-medium pl-1 animate-in fade-in">
            {inputErrors.name}
          </p>
        )}
      </div>

      {/* Field 2: Give your email id */}
      <div className="space-y-2">
        <label htmlFor="bpms-email" className="block text-sm font-medium text-slate-300">
          Give your email id
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="bpms-email"
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (inputErrors.email) {
                setInputErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#090f1d] border text-sm text-slate-100 placeholder-slate-500 font-normal focus:outline-none transition ${
              inputErrors.email
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40'
                : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'
            }`}
          />
        </div>
        {inputErrors.email && (
          <p className="text-[11px] text-rose-400 font-medium pl-1 animate-in fade-in">
            {inputErrors.email}
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Blue Action Button: "→ Submit Request" */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#1d64f2] hover:bg-[#1557e0] text-white font-bold text-sm shadow-xl shadow-blue-600/35 transition transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Submitting Request...</span>
            </>
          ) : (
            <span>&rarr; Submit Request</span>
          )}
        </button>
      </div>

      {/* Non-submitting secondary "Back" link below */}
      <div className="text-center pt-1 pb-1">
        <button
          type="button"
          onClick={handleBack}
          disabled={isLoading}
          className="text-xs text-slate-400 hover:text-white transition inline-block cursor-pointer"
        >
          Back
        </button>
      </div>

      {/* Footer Text */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>BPMS Enterprise Security</span>
        </span>
        <span>Gated Verification</span>
      </div>
    </form>
  );

  /**
   * Render Pending Approval View
   */
  const renderPendingView = () => (
    <div className="space-y-6 my-2 text-center animate-in fade-in duration-200">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Status: Pending
        </span>
      </div>

      <h1 className="text-2xl font-bold text-white tracking-tight">Request Sent</h1>

      <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
        Your request has been sent to the Super Admin. Please wait for approval.
      </p>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            setViewStep('form');
            setSubmittedRecord(null);
            setFullName('');
            setEmail('');
            setInputErrors({});
            setErrorMessage(null);
            if (isModal && onClose) {
              onClose();
            }
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-[#1d64f2] hover:bg-[#1557e0] text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition transform active:scale-[0.99] cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  const cardContent = (
    <div className="w-full max-w-[420px] bg-[#0c1427]/95 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-slate-100 backdrop-blur-xl">
      {isModal && onClose && (
        <div className="flex justify-end -mt-2 -mr-2 mb-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {viewStep === 'form' ? renderFormView() : renderPendingView()}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner matching image.png */}
      <div className="mb-7 flex items-center gap-3.5 relative z-10">
        {/* Blue icon with glowing rounded-2xl square */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1d64f2] to-[#3b82f6] flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/30 shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ProductionPulse BPMS</h1>
          <p className="text-xs text-slate-400">Enterprise BIM Process & Workforce Management</p>
        </div>
      </div>

      {cardContent}
    </div>
  );
};
