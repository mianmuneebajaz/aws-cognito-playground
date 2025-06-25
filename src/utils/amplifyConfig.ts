import { Amplify } from 'aws-amplify';
import { CognitoConfig } from '../types';

export const configureAmplify = (config: CognitoConfig) => {
  const amplifyConfig = {
    Auth: {
      Cognito: {
        region: config.region,
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolWebClientId,
        identityPoolId: config.identityPoolId,
        signUpVerificationMethod: 'code' as const,
        loginWith: {
          oauth: {
            domain: '',
            scopes: [],
            redirectSignIn: '',
            redirectSignOut: '',
            responseType: 'code' as const
          },
          username: 'true' as const,
          email: 'false' as const,
          phone: 'false' as const
        }
      }
    }
  };

  try {
    Amplify.configure(amplifyConfig);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Configuration failed' };
  }
};