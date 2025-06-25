import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { signIn, getCurrentUser, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { withLogging } from '../../utils/apiLogger';
import { AuthTokens } from '../../types';
import { Modal } from '../Modal';
import { TokenViewer } from '../TokenViewer';

interface LoginTabProps {
  onUserStateChange: () => void;
  activeConfigName: string | null;
}

export const LoginTab: React.FC<LoginTabProps> = ({ onUserStateChange, activeConfigName }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberDevice: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; tokens?: AuthTokens } | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  const handleLogin = async () => {
    if (!activeConfigName) {
      setResult({ type: 'error', message: 'Please configure and activate a Cognito profile first' });
      return;
    }

    if (!formData.username || !formData.password) {
      setResult({ type: 'error', message: 'Please enter both username and password' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // First, try to sign out any existing user to clear the session
      try {
        await withLogging(
          'signOut',
          {},
          () => signOut()
        );
      } catch (signOutError) {
        // Ignore sign out errors if no user is signed in
        console.log('No existing user to sign out:', signOutError);
      }

      const signInResult = await withLogging(
        'signIn',
        { username: formData.username, password: formData.password },
        () => signIn({ username: formData.username, password: formData.password })
      );

      if (signInResult.isSignedIn) {
        const currentUser = await getCurrentUser();
        
        // Fetch the actual tokens from the session
        let tokens: AuthTokens = {};
        try {
          const session = await fetchAuthSession();
          tokens = {
            idToken: session.tokens?.idToken?.toString(),
            accessToken: session.tokens?.accessToken?.toString(),
            refreshToken: session.tokens?.refreshToken?.toString()
          };
        } catch (tokenError) {
          console.error('Failed to fetch tokens:', tokenError);
          tokens = {
            idToken: 'Failed to retrieve token',
            accessToken: 'Failed to retrieve token',
            refreshToken: 'Failed to retrieve token'
          };
        }

        setResult({
          type: 'success',
          message: `Successfully signed in as ${currentUser.username}`,
          tokens
        });
        onUserStateChange();
      } else {
        setResult({
          type: 'error',
          message: `Sign-in incomplete: ${signInResult.nextStep?.signInStep || 'Unknown step required'}`
        });
      }
    } catch (error) {
      let message = 'Sign-in failed';
      
      if (error instanceof Error) {
        if (error.message.includes('There is already a signed in user')) {
          message = 'There is already a signed in user. Please sign out first or refresh the page.';
        } else {
          message = error.message;
        }
      }
      
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (result) setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Sign In</h2>
        
        {!activeConfigName && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">Please configure and activate a Cognito profile first</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter username or email"
              disabled={!activeConfigName}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
                disabled={!activeConfigName}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                disabled={!activeConfigName}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberDevice"
              checked={formData.rememberDevice}
              onChange={(e) => handleInputChange('rememberDevice', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              disabled={!activeConfigName}
            />
            <label htmlFor="rememberDevice" className="ml-2 text-sm text-slate-700">
              Remember this device
            </label>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleLogin}
            disabled={isLoading || !activeConfigName}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Result</h3>
          
          <div className={`p-3 rounded-lg flex items-start space-x-2 ${
            result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{result.message}</p>
            </div>
          </div>

          {result.tokens && result.type === 'success' && (
            <div className="mt-4">
              <button
                onClick={() => setShowTokenModal(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                View Tokens
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title="Authentication Tokens"
        size="lg"
      >
        {result?.tokens && <TokenViewer tokens={result.tokens} />}
      </Modal>
    </div>
  );
};