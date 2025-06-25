import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { withLogging } from '../../utils/apiLogger';

interface ForgotPasswordTabProps {
  activeConfigName: string | null;
}

export const ForgotPasswordTab: React.FC<ForgotPasswordTabProps> = ({ activeConfigName }) => {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [formData, setFormData] = useState({
    username: '',
    confirmationCode: '',
    newPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRequestReset = async () => {
    if (!activeConfigName) {
      setResult({ type: 'error', message: 'Please configure and activate a Cognito profile first' });
      return;
    }

    if (!formData.username) {
      setResult({ type: 'error', message: 'Please enter your username' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const resetResult = await withLogging(
        'resetPassword',
        { username: formData.username },
        () => resetPassword({ username: formData.username })
      );

      if (resetResult.nextStep?.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        setStep('confirm');
        setResult({
          type: 'success',
          message: 'Password reset code sent! Please check your email for the confirmation code.'
        });
      } else {
        setResult({
          type: 'error',
          message: 'Unexpected response from password reset request'
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset request failed';
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!formData.confirmationCode || !formData.newPassword) {
      setResult({ type: 'error', message: 'Please enter both confirmation code and new password' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      await withLogging(
        'confirmResetPassword',
        { username: formData.username, confirmationCode: formData.confirmationCode },
        () => confirmResetPassword({
          username: formData.username,
          confirmationCode: formData.confirmationCode,
          newPassword: formData.newPassword
        })
      );

      setResult({
        type: 'success',
        message: 'Password reset successfully! You can now sign in with your new password.'
      });

      // Reset form after success
      setTimeout(() => {
        setStep('request');
        setFormData({ username: '', confirmationCode: '', newPassword: '' });
        setResult(null);
      }, 3000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset confirmation failed';
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (result) setResult(null);
  };

  if (step === 'confirm') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Reset Password</h2>
          
          <p className="text-slate-600 mb-4">
            We sent a confirmation code to your email. Enter the code and your new password below.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmation Code
              </label>
              <input
                type="text"
                value={formData.confirmationCode}
                onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter confirmation code"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleConfirmReset}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isLoading ? 'Resetting...' : 'Reset Password'}</span>
            </button>
            
            <button
              onClick={() => setStep('request')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className={`p-3 rounded-lg flex items-start space-x-2 ${
              result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 mt-0.5" />
              )}
              <p className="font-medium">{result.message}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Forgot Password</h2>
        
        {!activeConfigName && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">Please configure and activate a Cognito profile first</span>
          </div>
        )}

        <p className="text-slate-600 mb-4">
          Enter your username to receive a password reset code via email.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username or Email
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your username or email"
            disabled={!activeConfigName}
          />
        </div>

        <div className="mt-6">
          <button
            onClick={handleRequestReset}
            disabled={isLoading || !activeConfigName}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isLoading ? 'Sending Code...' : 'Send Reset Code'}</span>
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className={`p-3 rounded-lg flex items-start space-x-2 ${
            result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5" />
            )}
            <p className="font-medium">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};