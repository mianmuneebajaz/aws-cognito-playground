import { useState, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { UserState } from '../types';

export const useUserState = () => {
  const [userState, setUserState] = useState<UserState>({
    isSignedIn: false
  });

  const updateUserState = async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      // Fetch current session to get tokens
      let tokens;
      try {
        const session = await fetchAuthSession();
        tokens = {
          idToken: session.tokens?.idToken?.toString(),
          accessToken: session.tokens?.accessToken?.toString(),
          refreshToken: session.tokens?.refreshToken?.toString()
        };
      } catch (tokenError) {
        console.log('Could not fetch tokens:', tokenError);
        tokens = undefined;
      }
      
      setUserState({
        isSignedIn: true,
        username: user.username,
        email: attributes.email,
        attributes,
        tokens
      });
    } catch (error) {
      setUserState({ isSignedIn: false });
    }
  };

  useEffect(() => {
    // Initial check
    updateUserState();

    // Listen for auth events
    const hubListener = (data: any) => {
      const { channel, payload } = data;
      
      if (channel === 'auth') {
        switch (payload.event) {
          case 'signedIn':
          case 'signUp':
            updateUserState();
            break;
          case 'signedOut':
            setUserState({ isSignedIn: false });
            break;
          default:
            break;
        }
      }
    };

    const unsubscribe = Hub.listen('auth', hubListener);

    return () => {
      unsubscribe();
    };
  }, []);

  return { userState, updateUserState };
};