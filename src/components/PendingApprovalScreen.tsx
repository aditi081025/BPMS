import React, { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useBimData } from '../context/BimDataContext';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

export const PendingApprovalScreen: React.FC = () => {
  const { user, updateCurrentUser, logout } = useAuth();
  const { currentUser, signOut } = useBimData();

  const activeUser = user || currentUser;
  const uid = activeUser?.googleId || activeUser?.id;

  // Real-time Firestore listener for live Super Admin approval
  useEffect(() => {
    if (!uid) return;

    let unsubscribe: (() => void) | undefined;
    try {
      const docRef = doc(db, 'access_requests', uid);
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
                  role: data?.role || 'BIM Modeler / Editor',
                  name: data?.name || activeUser?.name,
                });
              }, 400);
            } else if (firestoreStatus === 'rejected') {
              updateCurrentUser({ status: 'rejected' });
            }
          }
        },
        (error) => {
          console.warn('Real-time access_requests listener notice:', error);
        }
      );
    } catch (e) {
      console.warn('Error setting up onSnapshot listener:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [uid, updateCurrentUser, activeUser]);

  const handleBackToLogin = () => {
    logout();
    signOut();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Minimal Post-Submission Confirmation Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-slate-100 text-center space-y-6">
        {/* Top Status Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Status: Pending
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Request Sent
        </h1>

        {/* Subtext */}
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Your request has been sent to the Super Admin. Please wait for approval.
        </p>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition transform active:scale-[0.99] cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};
