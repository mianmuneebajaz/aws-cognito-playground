import React, { useState, useEffect } from "react";
import {
  Shield,
  Smartphone,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Settings,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  setUpTOTP,
  verifyTOTPSetup,
  updateMFAPreference,
  fetchMFAPreference,
  fetchUserAttributes,
  getCurrentUser,
} from "aws-amplify/auth";
import { withLogging } from "../../utils/apiLogger";
import QRCode from "qrcode";

interface OTPTabProps {
  activeConfigName: string | null;
}

type MFAMethod = "TOTP" | "SMS" | "EMAIL";
type MFAStep =
  | "overview"
  | "totp-setup"
  | "totp-verify"
  | "sms-setup"
  | "email-setup";

interface MFAStatus {
  enabled: MFAMethod[];
  preferred?: MFAMethod;
}

interface UserProfile {
  phone?: string;
  phoneVerified: boolean;
  email?: string;
  emailVerified: boolean;
}

export const OTPTab: React.FC<OTPTabProps> = ({ activeConfigName }) => {
  const [currentStep, setCurrentStep] = useState<MFAStep>("overview");
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: [] });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    phoneVerified: false,
    emailVerified: false,
  });

  const [setupData, setSetupData] = useState<{
    secretCode?: string;
    qrCodeUri?: string;
    qrCodeDataUrl?: string;
  }>({});

  const [formData, setFormData] = useState({
    totpCode: "",
    verificationCode: "",
    phoneNumber: "",
    emailAddress: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Initialize MFA status and user profile
  useEffect(() => {
    const initializeMFAData = async () => {
      if (!activeConfigName) return;

      try {
        // First check if user is signed in
        const currentUser = await getCurrentUser().catch(() => null);
        if (!currentUser) {
          console.log("User not signed in, cannot fetch MFA preferences");
          return;
        }

        // Fetch user attributes first
        const attributes = await withLogging("fetchUserAttributes", {}, () =>
          fetchUserAttributes()
        );

        // Try to fetch MFA preferences
        let mfaPreference;
        try {
          mfaPreference = await withLogging("fetchMFAPreference", {}, () =>
            fetchMFAPreference()
          );
        } catch {
          console.log(
            "MFA preferences not configured yet, starting with empty state"
          );
          // If MFA preferences can't be fetched, initialize with empty state
          mfaPreference = { enabled: undefined, preferred: undefined };
        }

        // Parse enabled MFA methods from preference response
        // Note: AWS Cognito has updated MFA structure - TOTP is now part of WebAuthn/Passkey config
        const enabled: MFAMethod[] = [];

        if (mfaPreference.enabled && Array.isArray(mfaPreference.enabled)) {
          const enabledStrings = mfaPreference.enabled.map((item) =>
            String(item)
          );

          // Check for TOTP/WebAuthn (now grouped together in newer Cognito)
          if (
            enabledStrings.includes("TOTP") ||
            enabledStrings.includes("WEB_AUTHN") ||
            enabledStrings.includes("SOFTWARE_TOKEN_MFA")
          ) {
            enabled.push("TOTP");
          }

          if (
            enabledStrings.includes("SMS") ||
            enabledStrings.includes("SMS_MFA")
          ) {
            enabled.push("SMS");
          }

          // New Email MFA support (introduced Sept 2024)
          if (
            enabledStrings.includes("EMAIL") ||
            enabledStrings.includes("EMAIL_MFA")
          ) {
            enabled.push("EMAIL");
          }
        }

        console.log("MFA preference response structure:", mfaPreference);
        console.log("Detected enabled MFA methods:", enabled);

        // Alternative detection: Try to check if TOTP was set up during sign-in
        // In newer Cognito versions, TOTP might be part of WebAuthn credentials
        if (enabled.length === 0) {
          console.log(
            "No MFA methods detected via fetchMFAPreference. This might be due to:"
          );
          console.log(
            "1. TOTP being part of WebAuthn/Passkey configuration in newer Cognito"
          );
          console.log("2. MFA preferences not being set after TOTP setup");
          console.log("3. User pool using newer Essentials/Plus tier");

          // Note: listWebAuthnCredentials might be available in Gen 2 / newer versions
          // For Gen 1, we'll provide helpful guidance
        }

        setMfaStatus({
          enabled,
          preferred: mfaPreference.preferred as MFAMethod,
        });

        // Update user profile
        setUserProfile({
          phone: attributes.phone_number,
          phoneVerified: attributes.phone_number_verified === "true",
          email: attributes.email,
          emailVerified: attributes.email_verified === "true",
        });
      } catch (error) {
        console.error("Failed to initialize MFA data:", error);
        setResult({
          type: "error",
          message:
            "Failed to load MFA status. Please ensure you are signed in.",
        });
      }
    };

    initializeMFAData();
  }, [activeConfigName]);

  // Generate QR code when URI is available
  useEffect(() => {
    const generateQRCode = async () => {
      if (setupData.qrCodeUri) {
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(setupData.qrCodeUri, {
            width: 256,
            margin: 2,
            color: {
              dark: "#1f2937",
              light: "#ffffff",
            },
          });
          setSetupData((prev) => ({ ...prev, qrCodeDataUrl }));
        } catch (error) {
          console.error("Failed to generate QR code:", error);
          setResult({
            type: "error",
            message:
              "Failed to generate QR code. Please use the manual entry method below.",
          });
        }
      }
    };

    generateQRCode();
  }, [setupData.qrCodeUri]);

  const handleSetupTOTP = async () => {
    if (!activeConfigName) {
      setResult({
        type: "error",
        message: "Please configure and activate a Cognito profile first",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const totpSetup = await withLogging("setUpTOTP", {}, () => setUpTOTP());

      const setupUri = totpSetup.getSetupUri("CognitoDebugTool");
      const setupUriString = setupUri.toString();

      console.log("Setup URI object:", setupUri);
      console.log("Setup URI string:", setupUriString);
      console.log("Secret code:", totpSetup.sharedSecret);

      setSetupData({
        secretCode: totpSetup.sharedSecret,
        qrCodeUri: setupUriString,
      });

      setCurrentStep("totp-verify");
      setResult({
        type: "success",
        message:
          "TOTP setup initiated. Scan the QR code or manually enter the secret in your authenticator app.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "TOTP setup failed";
      setResult({ type: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!formData.totpCode) {
      setResult({
        type: "error",
        message: "Please enter the TOTP code from your authenticator app",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // First verify the TOTP setup
      await withLogging(
        "verifyTOTPSetup",
        { totpCode: formData.totpCode },
        () => verifyTOTPSetup({ code: formData.totpCode })
      );

      // After successful verification, automatically enable TOTP
      await withLogging("updateMFAPreference", { totp: "ENABLED" }, () =>
        updateMFAPreference({ totp: "ENABLED" })
      );

      // Update local state to show TOTP as enabled
      setMfaStatus((prev) => ({
        ...prev,
        enabled: [...prev.enabled.filter((m) => m !== "TOTP"), "TOTP"],
        preferred: !prev.preferred ? "TOTP" : prev.preferred,
      }));

      setResult({
        type: "success",
        message:
          "TOTP verification successful! MFA is now enabled for your account.",
      });

      // Clear the form and go back to overview
      setFormData((prev) => ({ ...prev, totpCode: "" }));
      setTimeout(() => {
        setCurrentStep("overview");
      }, 1500);
    } catch (error) {
      console.error("TOTP verification failed:", error);
      const message =
        error instanceof Error ? error.message : "TOTP verification failed";
      setResult({ type: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (result) setResult(null);
  };

  const renderSetupStep = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Multi-Factor Authentication Setup
      </h2>

      {!activeConfigName && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-amber-700">
            Please configure and activate a Cognito profile first
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-medium text-slate-900">
              Time-based One-Time Password (TOTP)
            </h3>
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
          <span>{isLoading ? "Setting up..." : "Setup TOTP MFA"}</span>
        </button>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Verify TOTP Setup
      </h2>

      <div className="space-y-6">
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium text-slate-900 mb-2 flex items-center space-x-2">
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </h3>
          {setupData.qrCodeDataUrl ? (
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg border">
                <p className="text-xs text-slate-500 mb-2">
                  Scan this QR code with your authenticator app
                </p>
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="TOTP QR Code"
                  className="mx-auto rounded"
                  width={200}
                  height={200}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg border">
                <p className="text-xs text-slate-500 mb-2">
                  Generating QR code...
                </p>
                <div className="w-48 h-48 bg-slate-200 rounded flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium text-slate-900 mb-2">Manual Entry</h3>
          <p className="text-sm text-slate-600 mb-2">
            If you can't scan the QR code, enter this secret manually:
          </p>
          <div className="bg-slate-200 p-3 rounded border">
            <code className="text-xs font-mono break-all select-all">
              {setupData.secretCode || "Secret not available"}
            </code>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Click the secret above to select and copy it
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Enter TOTP Code from Authenticator App
          </label>
          <input
            type="text"
            value={formData.totpCode}
            onChange={(e) => handleInputChange("totpCode", e.target.value)}
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
          <span>{isLoading ? "Verifying..." : "Verify Setup"}</span>
        </button>

        <button
          onClick={() => setCurrentStep("overview")}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );

  // MFA method toggle function
  const toggleMFAMethod = async (method: MFAMethod, enable: boolean) => {
    if (!activeConfigName) {
      setResult({
        type: "error",
        message: "Please configure and activate a Cognito profile first",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      if (method === "TOTP") {
        if (enable) {
          // For TOTP, we need to check if it's already set up
          // Try to enable it directly - if it fails, user needs to set it up first
          try {
            await withLogging("updateMFAPreference", { totp: "ENABLED" }, () =>
              updateMFAPreference({ totp: "ENABLED" })
            );

            // Success - TOTP was already set up, just needed to be enabled
            setMfaStatus((prev) => ({
              ...prev,
              enabled: [...prev.enabled.filter((m) => m !== method), method],
              preferred: !prev.preferred ? method : prev.preferred,
            }));

            setResult({
              type: "success",
              message: "TOTP MFA enabled successfully",
            });
          } catch (error) {
            // Failed to enable - likely means TOTP is not set up yet
            console.log("TOTP not set up yet, redirecting to setup:", error);
            setCurrentStep("totp-setup");
            return;
          }
        } else {
          // Disable TOTP
          await withLogging("updateMFAPreference", { totp: "DISABLED" }, () =>
            updateMFAPreference({ totp: "DISABLED" })
          );

          setMfaStatus((prev) => ({
            ...prev,
            enabled: prev.enabled.filter((m) => m !== method),
            preferred: prev.preferred === method ? undefined : prev.preferred,
          }));

          setResult({
            type: "success",
            message: "TOTP MFA disabled successfully",
          });
        }
      } else if (method === "SMS") {
        if (enable) {
          if (!userProfile.phoneVerified) {
            setResult({
              type: "error",
              message:
                "Please verify your phone number before enabling SMS MFA.",
            });
            return;
          }

          await withLogging("updateMFAPreference", { sms: "ENABLED" }, () =>
            updateMFAPreference({ sms: "ENABLED" })
          );

          setMfaStatus((prev) => ({
            ...prev,
            enabled: [...prev.enabled.filter((m) => m !== method), method],
            preferred: !prev.preferred ? method : prev.preferred,
          }));

          setResult({
            type: "success",
            message: "SMS MFA enabled successfully",
          });
        } else {
          await withLogging("updateMFAPreference", { sms: "DISABLED" }, () =>
            updateMFAPreference({ sms: "DISABLED" })
          );

          setMfaStatus((prev) => ({
            ...prev,
            enabled: prev.enabled.filter((m) => m !== method),
            preferred: prev.preferred === method ? undefined : prev.preferred,
          }));

          setResult({
            type: "success",
            message: "SMS MFA disabled successfully",
          });
        }
      } else if (method === "EMAIL") {
        if (enable) {
          if (!userProfile.emailVerified) {
            setResult({
              type: "error",
              message:
                "Please verify your email address before enabling Email MFA.",
            });
            return;
          }

          await withLogging("updateMFAPreference", { email: "ENABLED" }, () =>
            updateMFAPreference({ email: "ENABLED" })
          );

          setMfaStatus((prev) => ({
            ...prev,
            enabled: [...prev.enabled.filter((m) => m !== method), method],
            preferred: !prev.preferred ? method : prev.preferred,
          }));

          setResult({
            type: "success",
            message: "Email MFA enabled successfully",
          });
        } else {
          await withLogging("updateMFAPreference", { email: "DISABLED" }, () =>
            updateMFAPreference({ email: "DISABLED" })
          );

          setMfaStatus((prev) => ({
            ...prev,
            enabled: prev.enabled.filter((m) => m !== method),
            preferred: prev.preferred === method ? undefined : prev.preferred,
          }));

          setResult({
            type: "success",
            message: "Email MFA disabled successfully",
          });
        }
      }
    } catch (error) {
      console.error(
        `Failed to ${enable ? "enable" : "disable"} ${method} MFA:`,
        error
      );
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${enable ? "enable" : "disable"} ${method} MFA`;
      setResult({ type: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

  // Render MFA Overview
  const renderMFAOverview = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Multi-Factor Authentication
            </h2>
            <p className="text-slate-600 mt-1">
              Secure your account with additional verification methods
            </p>
          </div>
          <Settings className="w-6 h-6 text-slate-400" />
        </div>

        {!activeConfigName && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">
              Please configure and activate a Cognito profile first
            </span>
          </div>
        )}

        {/* AWS Cognito Update Notice */}
        {mfaStatus.enabled.length === 0 && activeConfigName && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">
                  ⚠️ AWS Cognito Updates (Late 2024)
                </h3>
                <p className="text-sm text-blue-800 mt-1">
                  If you've set up TOTP during sign-in but it shows as disabled,
                  this may be due to AWS Cognito's restructured MFA system:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                  <li>
                    <strong>TOTP is now part of WebAuthn/Passkey</strong>{" "}
                    configuration in newer user pools
                  </li>
                  <li>
                    <strong>Email MFA</strong> support added (September 2024)
                  </li>
                  <li>
                    <strong>New tiers:</strong> Lite, Essentials, Plus with
                    different features
                  </li>
                </ul>
                <div className="mt-3 text-sm text-blue-800">
                  <strong>Solutions:</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>
                      Try the "Enable TOTP" toggle below to set MFA preference
                    </li>
                    <li>
                      Consider upgrading to <strong>Amplify Gen 2</strong> for
                      latest WebAuthn APIs
                    </li>
                    <li>Check your User Pool tier in AWS Console → Cognito</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* TOTP MFA Card */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">
                    Authenticator App (TOTP)
                  </h3>
                  <p className="text-sm text-slate-600">
                    Use Google Authenticator, Authy, or similar apps
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    ⚠️ Note: In newer AWS Cognito (Essentials/Plus tiers), TOTP
                    is part of WebAuthn/Passkey configuration
                  </p>
                  {mfaStatus.enabled.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      If you've set up TOTP during sign-in but it shows as
                      disabled, this may be due to Cognito's new structure.
                      Consider upgrading to Amplify Gen 2 for better WebAuthn
                      support.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {mfaStatus.enabled.includes("TOTP") ? (
                  <>
                    <span className="text-sm text-green-600 font-medium">
                      Enabled
                    </span>
                    <button
                      onClick={() => toggleMFAMethod("TOTP", false)}
                      disabled={isLoading || !activeConfigName}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-400 font-medium">
                      Disabled
                    </span>
                    <button
                      onClick={() => setCurrentStep("totp-setup")}
                      disabled={isLoading || !activeConfigName}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ToggleLeft className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SMS MFA Card */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">
                    SMS Text Message
                  </h3>
                  <p className="text-sm text-slate-600">
                    {userProfile.phone
                      ? `Send codes to ${userProfile.phone}`
                      : "No phone number configured"}
                  </p>
                  {userProfile.phone && !userProfile.phoneVerified && (
                    <p className="text-sm text-amber-600">
                      Phone number needs verification
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {mfaStatus.enabled.includes("SMS") ? (
                  <>
                    <span className="text-sm text-green-600 font-medium">
                      Enabled
                    </span>
                    <button
                      onClick={() => toggleMFAMethod("SMS", false)}
                      disabled={isLoading || !activeConfigName}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-400 font-medium">
                      Disabled
                    </span>
                    <button
                      onClick={() =>
                        userProfile.phoneVerified
                          ? toggleMFAMethod("SMS", true)
                          : setCurrentStep("sms-setup")
                      }
                      disabled={
                        isLoading || !activeConfigName || !userProfile.phone
                      }
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                      <ToggleLeft className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Email MFA Card */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">
                    Email Verification
                  </h3>
                  <p className="text-sm text-slate-600">
                    {userProfile.email
                      ? `Send codes to ${userProfile.email}`
                      : "No email configured"}
                  </p>
                  {userProfile.email && !userProfile.emailVerified && (
                    <p className="text-sm text-amber-600">
                      Email needs verification
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {mfaStatus.enabled.includes("EMAIL") ? (
                  <>
                    <span className="text-sm text-green-600 font-medium">
                      Enabled
                    </span>
                    <button
                      onClick={() => toggleMFAMethod("EMAIL", false)}
                      disabled={isLoading || !activeConfigName}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-400 font-medium">
                      Disabled
                    </span>
                    <button
                      onClick={() =>
                        userProfile.emailVerified
                          ? toggleMFAMethod("EMAIL", true)
                          : setCurrentStep("email-setup")
                      }
                      disabled={
                        isLoading || !activeConfigName || !userProfile.email
                      }
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                      <ToggleLeft className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {mfaStatus.enabled.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Current MFA Status
            </h4>
            <div className="space-y-1">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Enabled methods:</span>{" "}
                {mfaStatus.enabled.join(", ")}
              </p>
              {mfaStatus.preferred && (
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Preferred method:</span>{" "}
                  {mfaStatus.preferred}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render SMS Setup
  const renderSMSSetup = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        SMS MFA Setup
      </h2>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span className="text-blue-900 font-medium">
              Phone Number Required
            </span>
          </div>
          <p className="text-sm text-blue-700">
            To enable SMS MFA, you need a verified phone number. Please ensure
            your phone number is added and verified in your profile settings.
          </p>
        </div>

        {userProfile.phone && !userProfile.phoneVerified && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700">
              Your phone number <strong>{userProfile.phone}</strong> needs to be
              verified before enabling SMS MFA.
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={() => setCurrentStep("overview")}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Back to Overview
        </button>
      </div>
    </div>
  );

  // Render Email Setup
  const renderEmailSetup = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Email MFA Setup
      </h2>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-blue-900 font-medium">
              Email Address Required
            </span>
          </div>
          <p className="text-sm text-blue-700">
            To enable Email MFA, you need a verified email address. Please
            ensure your email is added and verified in your profile settings.
          </p>
        </div>

        {userProfile.email && !userProfile.emailVerified && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700">
              Your email <strong>{userProfile.email}</strong> needs to be
              verified before enabling Email MFA.
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={() => setCurrentStep("overview")}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Back to Overview
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {currentStep === "overview" && renderMFAOverview()}
      {currentStep === "totp-setup" && renderSetupStep()}
      {currentStep === "totp-verify" && renderVerifyStep()}
      {currentStep === "sms-setup" && renderSMSSetup()}
      {currentStep === "email-setup" && renderEmailSetup()}

      {result && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div
            className={`p-3 rounded-lg flex items-start space-x-2 ${
              result.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {result.type === "success" ? (
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
