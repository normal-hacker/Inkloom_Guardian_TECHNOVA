import { serverEnv } from '../env';

export interface AuthProvidersInfo {
  demo: boolean;
  password: boolean;
  google: boolean;
}

export function getAuthProviders(): AuthProvidersInfo {
  return {
    demo: serverEnv.isDemoMode,
    password: true,
    google: serverEnv.isGoogleAuthEnabled,
  };
}
