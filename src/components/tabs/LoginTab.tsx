import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, CheckCircle, AlertTriangle, Shield, Mail, Phone, Key, RefreshCw } from 'lucide-react';
import { signIn, getCurrentUser, signOut, fetchAuthSession, confirmSignIn, resendSignUpCode } from 'aws-amplify/auth';
import { withLogging } from '../../utils/apiLogger';
import { AuthTokens } from '../../types';
import { Modal } from '../Modal';
import { TokenViewer } from '../TokenViewer';

interface LoginTabProps {
  onUserStateChange: () => void;
  activeConfigName: string | null;
}

type NextStepType = 
  | 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'
  | 'CONFIRM_SIGN_IN_WITH_SMS_CODE'
  | 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'
  | 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
  | 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE'
  | 'CONFIRM_SIGN_UP'
  | 'RESET_PASSWORD'
  | 'DONE';

export const LoginTab: React.FC<LoginTabProps> = ({ onUserStateChange, activeConfigName }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberDevice: false
  });
  
  const [challengeData, setChallengeData] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
    customChallengeAnswer: '',
    challengeName: '' as NextStepType | '',
    session: '',
    codeDeliveryDetails: null as any
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChallengeStep, setShowChallengeStep] = useState(false);
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
    setShowChallengeStep(false);

    try {
      // First, try to sign out any existing user to clear the session
      try {
        await withLogging(
          'signOut',
          {},
          () => signOut()
        );
      } catch (signOutError) {
        console.log('No existing user to sign out:', signOutError);
      }

      const signInResult = await withLogging(
        'signIn',
        { username: formData.username, password: formData.password },
        () => signIn({ username: formData.username, password: formData.password })
      );

      if (signInResult.isSignedIn) {
        await handleSuccessfulSignIn();
      } else {
        handleNextStep(signInResult.nextStep);
      }
    } catch (error) {
      let message = 'Sign-in failed';
      
      if (error instanceof Error) {
        if (error.message.includes('There is already a signed in user')) {
          message = 'There is already a signed in user. Please sign out first or refresh the page.';
        } else if (error.message.includes('User is not confirmed')) {
          message = 'User account is not confirmed. Please check your email for the confirmation code.';
        } else if (error.message.includes('Incorrect username or password')) {
          message = 'Incorrect username or password. Please try again.';
        } else if (error.message.includes('User does not exist')) {
          message = 'User does not exist. Please check your username or register a new account.';
        } else if (error.message.includes('Password attempts exceeded')) {
          message = 'Too many failed login attempts. Please try again later.';
        } else if (error.message.includes('User is disabled')) {
          message = 'User account has been disabled. Please contact support.';
        } else {
          message = error.message;
        }
      }
      
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = (nextStep: any) => {
    if (!nextStep) {
      setResult({ type: 'error', message: 'Unknown authentication step required' });
      return;
    }

    const stepType = nextStep.signInStep as NextStepType;
    
    setChallengeData(prev => ({
      ...prev,
      challengeName: stepType,
      codeDeliveryDetails: nextStep.codeDeliveryDetails || null
    }));

    setShowChallengeStep(true);

    switch (stepType) {
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        setResult({
          type: 'success',
          message: 'Please enter the TOTP code from your authenticator app to complete sign-in.'
        });
        break;
      
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
        const smsDestination = nextStep.codeDeliveryDetails?.destination || 'your phone';
        setResult({
          type: 'success',
          message: `A verification code has been sent via SMS to ${smsDestination}. Please enter the code to continue.`
        });
        break;
      
      case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
        const emailDestination = nextStep.codeDeliveryDetails?.destination || 'your email';
        setResult({
          type: 'success',
          message: `A verification code has been sent to ${emailDestination}. Please check your email and enter the code.`
        });
        break;
      
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        setResult({
          type: 'success',
          message: 'You must set a new password before continuing. Please enter a new password below.'
        });
        break;
      
      case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
        setResult({
          type: 'success',
          message: 'Custom authentication challenge required. Please provide the required information.'
        });
        break;
      
      case 'CONFIRM_SIGN_UP':
        setResult({
          type: 'error',
          message: 'Your account is not confirmed. Please check your email for the confirmation code and confirm your account first.'
        });
        break;
      
      case 'RESET_PASSWORD':
        setResult({
          type: 'error',
          message: 'Password reset is required. Please use the "Forgot Password" tab to reset your password.'
        });
        break;
      
      default:
        setResult({
          type: 'error',
          message: `Unsupported authentication step: ${stepType}`
        });
        break;
    }
  };

  const handleChallengeConfirmation = async () => {
    const { challengeName, code, newPassword, confirmPassword, customChallengeAnswer } = challengeData;

    // Validation based on challenge type
    if (challengeName === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      if (!newPassword || !confirmPassword) {
        setResult({ type: 'error', message: 'Please enter and confirm your new password' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setResult({ type: 'error', message: 'Passwords do not match' });
        return;
      }
      if (newPassword.length < 8) {
        setResult({ type: 'error', message: 'Password must be at least 8 characters long' });
        return;
      }
    } else if (challengeName === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
      if (!customChallengeAnswer) {
        setResult({ type: 'error', message: 'Please provide an answer to the custom challenge' });
        return;
      }
    } else {
      if (!code) {
        setResult({ type: 'error', message: 'Please enter the verification code' });
        return;
      }
    }

    setIsLoading(true);
    setResult(null);

    try {
      let challengeResponse = '';
      
      switch (challengeName) {
        case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
        case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
          challengeResponse = code;
          break;
        case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
          challengeResponse = newPassword;
          break;
        case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
          challengeResponse = customChallengeAnswer;
          break;
        default:
          throw new Error(`Unsupported challenge type: ${challengeName}`);
      }

      const confirmResult = await withLogging(
        'confirmSignIn',
        { challengeResponse: challengeResponse.substring(0, 10) + '...' }, // Log partial response for security
        () => confirmSignIn({ challengeResponse })
      );

      if (confirmResult.isSignedIn) {
        await handleSuccessfulSignIn();
        setShowChallengeStep(false);
      } else {
        // Handle additional steps if needed
        handleNextStep(confirmResult.nextStep);
      }
    } catch (error) {
      let message = 'Challenge confirmation failed';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid verification code')) {
          message = 'Invalid verification code. Please check the code and try again.';
        } else if (error.message.includes('Code mismatch')) {
          message = 'The verification code is incorrect. Please try again.';
        } else if (error.message.includes('Expired')) {
          message = 'The verification code has expired. Please request a new code.';
        } else if (error.message.includes('Invalid password')) {
          message = 'Password does not meet the requirements. Please try a stronger password.';
        } else {
          message = error.message;
        }
      }
      
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!challengeData.challengeName || 
        !['CONFIRM_SIGN_IN_WITH_SMS_CODE', 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'].includes(challengeData.challengeName)) {
      setResult({ type: 'error', message: 'Code resend is not available for this challenge type' });
      return;
    }

    setIsLoading(true);
    
    try {
      // Note: AWS Cognito doesn't have a direct resend for sign-in challenges
      // This would typically require re-initiating the sign-in process
      setResult({
        type: 'success',
        message: 'To receive a new code, please cancel and sign in again.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend code';
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulSignIn = async () => {
    try {
      const currentUser = await getCurrentUser();
      
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
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Sign-in completed but failed to fetch user details'
      });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (result) setResult(null);
  };

  const handleChallengeInputChange = (field: keyof typeof challengeData, value: string) => {
    setChallengeData(prev => ({ ...prev, [field]: value }));
    if (result) setResult(null);
  };

  const resetChallenge = () => {
    setShowChallengeStep(false);
    setChallengeData({
      code: '',
      newPassword: '',
      confirmPassword: '',
      customChallengeAnswer: '',
      challengeName: '',
      session: '',
      codeDeliveryDetails: null
    });
    setResult(null);
  };

  const getChallengeIcon = () => {
    switch (challengeData.challengeName) {
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        return Shield;
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
        return Phone;
      case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
        return Mail;
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        return Key;
      case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
        return AlertTriangle;
      default:
        return Shield;
    }
  };

  const getChallengeTitle = () => {
    switch (challengeData.challengeName) {
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        return 'TOTP Authentication Required';
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
        return 'SMS Verification Required';
      case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
        return 'Email Verification Required';
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        return 'New Password Required';
      case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
        return 'Custom Challenge Required';
      default:
        return 'Additional Verification Required';
    }
  };

  const ChallengeIcon = getChallengeIcon();

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
              disabled={!activeConfigName || showChallengeStep}
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
                disabled={!activeConfigName || showChallengeStep}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                disabled={!activeConfigName || showChallengeStep}
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
              disabled={!activeConfigName || showChallengeStep}
            />
            <label htmlFor="rememberDevice" className="ml-2 text-sm text-slate-700">
              Remember this device
            </label>
          </div>
        </div>

        {!showChallengeStep && (
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
        )}

        {showChallengeStep && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <ChallengeIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">{getChallengeTitle()}</h3>
            </div>
            
            <div className="space-y-4">
              {/* TOTP Code Input */}
              {challengeData.challengeName === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Enter TOTP Code from Authenticator App
                  </label>
                  <input
                    type="text"
                    value={challengeData.code}
                    onChange={(e) => handleChallengeInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              )}

              {/* SMS/Email Code Input */}
              {(challengeData.challengeName === 'CONFIRM_SIGN_IN_WITH_SMS_CODE' || 
                challengeData.challengeName === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    value={challengeData.code}
                    onChange={(e) => handleChallengeInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000000"
                    maxLength={6}
                  />
                  {challengeData.codeDeliveryDetails && (
                    <p className="text-xs text-slate-500 mt-1">
                      Code sent to: {challengeData.codeDeliveryDetails.destination}
                    </p>
                  )}
                </div>
              )}

              {/* New Password Input */}
              {challengeData.challengeName === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={challengeData.newPassword}
                        onChange={(e) => handleChallengeInputChange('newPassword', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={challengeData.confirmPassword}
                      onChange={(e) => handleChallengeInputChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </>
              )}

              {/* Custom Challenge Input */}
              {challengeData.challengeName === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Custom Challenge Response
                  </label>
                  <input
                    type="text"
                    value={challengeData.customChallengeAnswer}
                    onChange={(e) => handleChallengeInputChange('customChallengeAnswer', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your response"
                  />
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleChallengeConfirmation}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
                >
                  <ChallengeIcon className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying...' : 'Verify'}</span>
                </button>

                {(challengeData.challengeName === 'CONFIRM_SIGN_IN_WITH_SMS_CODE' || 
                  challengeData.challengeName === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') && (
                  <button
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend Code</span>
                  </button>
                )}
                
                <button
                  onClick={resetChallenge}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
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