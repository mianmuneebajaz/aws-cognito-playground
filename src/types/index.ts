export interface CognitoConfig {
  name: string;
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  identityPoolId?: string;
  authenticationFlowType: 'USER_SRP_AUTH' | 'USER_PASSWORD_AUTH' | 'ALLOW_USER_PASSWORD_AUTH';
}

export interface ApiLog {
  id: string;
  timestamp: string;
  action: string;
  request: any;
  response: any;
  status: 'success' | 'error';
  error?: string;
}

export interface UserState {
  isSignedIn: boolean;
  username?: string;
  email?: string;
  attributes?: Record<string, any>;
  mfaEnabled?: boolean;
  mfaType?: string;
  tokens?: AuthTokens;
}

export interface AuthTokens {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

export type TabType = 'config' | 'login' | 'register' | 'forgot' | 'otp' | 'debug';