import React, { useState } from 'react';
import { Shield, Smartphone, QrCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { setUpTOTP, verifyTOTPSetup, confirmSignIn } from 'aws-amplify/auth';
import { withLogging } from '../../utils/apiLogger';

interface OTPTabProps {
  activeConfigName: string | null;
}

export const OTPTab: React.FC<OTPTabProps> = ({ activeConfigName }) => {
  const [mfaStep, setMfaStep] = useState<'setup' | 'verify' | 'authenticate'>('setup');
  const [setupData, setSetupData] = useState<{
    secretCode?: string;
    qrCodeUri?: string;
  }>({});
  const [formData, setFormData] = useState({
    totpCode: '',
    verificationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSetupTOTP = async () => {
    if (!activeConfigName) {
      setResult({ type: 'error', message: 'Please configure and activate a Cognito profile first' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const totpSetup = await withLogging(
        'setUpTOTP',
        {},
        () => setUpTOTP()
      );

      setSetupData({
        secretCode: totpSetup.sharedSecret,
        qrCodeUri: totpSetup.getSetupUri('CognitoDebugTool')
      });

      setMfaStep('verify');
      setResult({
        type: 'success',
        message: 'TOTP setup initiated. Scan the QR code or manually enter the secret in your authenticator app.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'TOTP setup failed';
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!formData.totpCode) {
      setResult({ type: 'error', message: 'Please enter the TOTP code from your authenticator app' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      await withLogging(
        'verifyTOTPSetup',
        { totpCode: formData.totpCode },
        () => verifyTOTPSetup({ code: formData.totpCode })
      );

      setResult({
        type: 'success',
        message: 'TOTP verification successful! MFA is now enabled for your account.'
      });

      setMfaStep('authenticate');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'TOTP verification failed';
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticateMFA = async () => {
    if (!formData.verificationCode) {
      setResult({ type: 'error', message: 'Please enter the verification code' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Note: This would typically be called during the sign-in flow
      // when MFA is required. For demo purposes, we'll simulate this.
      setResult({
        type: 'success',
        message: 'MFA authentication would be processed during sign-in flow'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA authentication failed';
      setResult({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (result) setResult(null);
  };

  const renderSetupStep = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Multi-Factor Authentication Setup</h2>
      
      {!activeConfigName && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-amber-700">Please configure and activate a Cognito profile first</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-medium text-slate-900">Time-based One-Time Password (TOTP)</h3>
            <p className="text-sm text-slate-600">
              Use an authenticator app like Google Authenticator or Authy
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSetupTOTP}
          disabled={isLoading || !activeConfigName}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <Shield className="w-4 h-4" />
          <span>{isLoading ? 'Setting up...' : 'Setup TOTP MFA'}</span>
        </button>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Verify TOTP Setup</h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium text-slate-900 mb-2 flex items-center space-x-2">
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </h3>
          {setupData.qrCodeUri ? (
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg border">
                <p className="text-xs text-slate-500 mb-2">Scan this QR code with your authenticator app</p>
                <div className="w-32 h-32 bg-slate-200 rounded flex items-center justify-center">
                  <span className="text-xs text-slate-500">QR Code Placeholder</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">QR code not available</p>
          )}
        </div>

        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium text-slate-900 mb-2">Manual Entry</h3>
          <p className="text-sm text-slate-600 mb-2">
            If you can't scan the QR code, enter this secret manually:
          </p>
          <code className="text-xs bg-slate-200 px-2 py-1 rounded font-mono break-all">
            {setupData.secretCode || 'Secret not available'}
          </code>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Enter TOTP Code from Authenticator App
          </label>
          <input
            type="text"
            value={formData.totpCode}
            onChange={(e) => handleInputChange('totpCode', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="000000"
            maxLength={6}
          />
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={handleVerifySetup}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{isLoading ? 'Verifying...' : 'Verify Setup'}</span>
        </button>
        
        <button
          onClick={() => setMfaStep('setup')}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );

  const renderAuthenticateStep = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">MFA Authentication</h2>
      
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-700 font-medium">MFA is now enabled for your account</span>
        </div>
      </div>

      <p className="text-slate-600 mb-4">
        During sign-in, you'll be prompted to enter a verification code from your authenticator app.
        You can test the authentication process below:
      </p>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Verification Code
        </label>
        <input
          type="text"
          value={formData.verificationCode}
          onChange={(e) => handleInputChange('verificationCode', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="000000"
          maxLength={6}
        />
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={handleAuthenticateMFA}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
        >
          <Shield className="w-4 h-4" />
          <span>{isLoading ? 'Authenticating...' : 'Test Authentication'}</span>
        </button>
        
        <button
          onClick={() => {
            setMfaStep('setup');
            setFormData({ totpCode: '', verificationCode: '' });
            setSetupData({});
          }}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Setup New MFA
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {mfaStep === 'setup' && renderSetupStep()}
      {mfaStep === 'verify' && renderVerifyStep()}
      {mfaStep === 'authenticate' && renderAuthenticateStep()}

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