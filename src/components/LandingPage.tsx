import React from 'react';
import { AuthGateway } from './AuthGateway';

export interface LandingPageProps {
  onLoginSuccess?: (targetRoute?: string) => void;
  onEnterDashboard?: () => void;
  hasActiveSession?: boolean;
  attemptedRoute?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = (props) => {
  return <AuthGateway {...props} isModal={false} />;
};

export default LandingPage;
