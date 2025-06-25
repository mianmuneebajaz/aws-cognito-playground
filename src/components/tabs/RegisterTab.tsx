import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { withLogging } from '../../utils/apiLogger';

interface RegisterTabProps {
  activeConfigName: string | null;
}

export const RegisterTab: React.FC<RegisterTabProps> = ({ activeConfigName }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    phoneNumber: ''
  });
  const [confirmationData, setConfirmationData] = useState({
    code: '',
    username: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'confirm'>('register');
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRegister = async () => {
    if (!activeConfigName) {
      setResult({ type: 'error', message: 'Please configure and activate a Cognito profile first' });
      return;
    }

    if (!formData.username || !formData.password || !formData.email) {
      setResult({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const attributes: Record<string, string> = {
        email: formData.email
      };

      if (formData.name) attributes.name = formData.name;
      if (formData.phoneNumber) attributes.phone_number = formData.phoneNumber;

      const signUpResult = await withLogging(
        'signUp',
        { username: formData.username, attributes },
        () => signUp({
          username: formData.username,
          password: formData.password,
          options: { userAttributes: attributes }
        })
      );

      if (signUpResult.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        setConfirmationData({ code: '', username: formData.username });
        setStep('confirm');
        setResult({
          type: 'success',
          message: 'Registration successful! Please check your email for the confirmation code.'
        });
      } else {
        setResult({
          type: 'success',
          message: 'Registration completed successfully!'
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmationData.code) {
      setResult({ type: 'error', message: 'Please enter the confirmation code' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      await withLogging(
        'confirmSignUp',
        { username: confirmationData.username, confirmationCode: confirmationData.code },
        () => confirmSignUp({
          username: confirmationData.username,
          confirmationCode: confirmationData.code
        })
      );

      setResult({
        type: 'success',
        message: 'Account confirmed successfully! You can now sign in.'
      });
      
      // Reset form
      setTimeout(() => {
        setStep('register');
        setFormData({
          username: '',
          password: '',
          email: '',
          name: '',
          phoneNumber: ''
        });
        setConfirmationData({ code: '', username: '' });
        setResult(null);
      }, 3000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Confirmation failed';
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
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Confirm Registration</h2>
          
          <p className="text-slate-600 mb-4">
            We sent a confirmation code to your email. Please enter it below to complete your registration.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={confirmationData.username}
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
                value={confirmationData.code}
                onChange={(e) => setConfirmationData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isLoading ? 'Confirming...' : 'Confirm'}</span>
            </button>
            
            <button
              onClick={() => setStep('register')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back to Registration
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
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Account</h2>
        
        {!activeConfigName && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">Please configure and activate a Cognito profile first</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter username"
              disabled={!activeConfigName}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email"
              disabled={!activeConfigName}
            />
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password *
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
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name (Optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full name"
              disabled={!activeConfigName}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1234567890"
              disabled={!activeConfigName}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleRegister}
            disabled={isLoading || !activeConfigName}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
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