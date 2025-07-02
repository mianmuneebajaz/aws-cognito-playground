import React, { useState, useEffect } from "react";
import { Save, Trash2, AlertTriangle, CheckCircle, LogOut } from "lucide-react";
import { signOut } from "aws-amplify/auth";
import { CognitoConfig } from "../../types";
import {
  saveConfigurations,
  loadConfigurations,
  clearAllData,
} from "../../utils/storage";
import { configureAmplify } from "../../utils/amplifyConfig";
import { withLogging } from "../../utils/apiLogger";

interface ConfigurationTabProps {
  onConfigChange: (config: CognitoConfig | null) => void;
  activeConfig: CognitoConfig | null;
  onUserStateChange: () => void;
}

export const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  onConfigChange,
  activeConfig,
  onUserStateChange,
}) => {
  const [configs, setConfigs] = useState<CognitoConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<Partial<CognitoConfig>>({
    name: "",
    region: "us-east-1",
    userPoolId: "",
    userPoolWebClientId: "",
    identityPoolId: "",
    authenticationFlowType: "USER_SRP_AUTH",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const savedConfigs = loadConfigurations();
    setConfigs(savedConfigs);
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = () => {
    if (
      !currentConfig.name ||
      !currentConfig.region ||
      !currentConfig.userPoolId ||
      !currentConfig.userPoolWebClientId
    ) {
      showMessage("error", "Please fill in all required fields");
      return;
    }

    const newConfig = currentConfig as CognitoConfig;
    const updatedConfigs = [
      ...configs.filter((c) => c.name !== newConfig.name),
      newConfig,
    ];

    if (saveConfigurations(updatedConfigs)) {
      setConfigs(updatedConfigs);
      showMessage("success", "Configuration saved successfully");
    } else {
      showMessage("error", "Failed to save configuration");
    }
  };

  const handleLoad = async (config: CognitoConfig) => {
    try {
      // Sign out any existing user before switching configurations
      try {
        await withLogging("signOut", {}, () => signOut());
      } catch (signOutError) {
        // Ignore sign out errors if no user is signed in
        console.log("No user to sign out or sign out failed:", signOutError);
      }

      const result = configureAmplify(config);
      if (result.success) {
        setCurrentConfig(config);
        onConfigChange(config);
        onUserStateChange(); // Update user state after configuration change
        showMessage("success", `Loaded profile: ${config.name}`);
      } else {
        showMessage("error", `Failed to configure Amplify: ${result.error}`);
      }
    } catch (error) {
      showMessage(
        "error",
        `Failed to load configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleReset = async () => {
    try {
      // Sign out any existing user before resetting
      try {
        await withLogging("signOut", {}, () => signOut());
      } catch (signOutError) {
        // Ignore sign out errors if no user is signed in
        console.log("No user to sign out or sign out failed:", signOutError);
      }

      setCurrentConfig({
        name: "",
        region: "us-east-1",
        userPoolId: "",
        userPoolWebClientId: "",
        identityPoolId: "",
        authenticationFlowType: "USER_SRP_AUTH",
      });
      onConfigChange(null);
      onUserStateChange(); // Update user state after reset
      showMessage("success", "Configuration reset");
    } catch (error) {
      showMessage(
        "error",
        `Failed to reset configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleClearAll = async () => {
    try {
      // Sign out any existing user before clearing all data
      try {
        await withLogging("signOut", {}, () => signOut());
      } catch (signOutError) {
        // Ignore sign out errors if no user is signed in
        console.log("No user to sign out or sign out failed:", signOutError);
      }

      if (clearAllData()) {
        setConfigs([]);
        await handleReset();
        setShowClearConfirm(false);
        showMessage("success", "All data cleared");
      } else {
        showMessage("error", "Failed to clear data");
      }
    } catch (error) {
      showMessage(
        "error",
        `Failed to clear all data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Security Notice</h4>
            <p className="text-sm text-amber-700 mt-1">
              Configurations are stored in browser local storage. This data is
              not encrypted and may be accessible to browser extensions or
              scripts. Do not store production credentials.
            </p>
            <p className="text-sm text-amber-700 mt-2">
              <strong>Note:</strong> Switching configurations will automatically
              sign out any currently authenticated user to prevent
              authentication conflicts.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          AWS Cognito Configuration
        </h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Profile Name *
            </label>
            <input
              type="text"
              value={currentConfig.name || ""}
              onChange={(e) =>
                setCurrentConfig({ ...currentConfig, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Development"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Region *
            </label>
            <select
              value={currentConfig.region || "us-east-1"}
              onChange={(e) =>
                setCurrentConfig({ ...currentConfig, region: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="us-east-1">us-east-1</option>
              <option value="us-west-1">us-west-1</option>
              <option value="us-west-2">us-west-2</option>
              <option value="eu-west-1">eu-west-1</option>
              <option value="ap-southeast-1">ap-southeast-1</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              User Pool ID *
            </label>
            <input
              type="text"
              value={currentConfig.userPoolId || ""}
              onChange={(e) =>
                setCurrentConfig({
                  ...currentConfig,
                  userPoolId: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="us-east-1_XXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Client ID *
            </label>
            <input
              type="text"
              value={currentConfig.userPoolWebClientId || ""}
              onChange={(e) =>
                setCurrentConfig({
                  ...currentConfig,
                  userPoolWebClientId: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Client ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Identity Pool ID (Optional)
            </label>
            <input
              type="text"
              value={currentConfig.identityPoolId || ""}
              onChange={(e) =>
                setCurrentConfig({
                  ...currentConfig,
                  identityPoolId: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="us-east-1:xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Authentication Flow
            </label>
            <select
              value={currentConfig.authenticationFlowType || "USER_SRP_AUTH"}
              onChange={(e) =>
                setCurrentConfig({
                  ...currentConfig,
                  authenticationFlowType: e.target
                    .value as CognitoConfig["authenticationFlowType"],
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USER_SRP_AUTH">USER_SRP_AUTH</option>
              <option value="USER_PASSWORD_AUTH">USER_PASSWORD_AUTH</option>
              <option value="ALLOW_USER_PASSWORD_AUTH">
                ALLOW_USER_PASSWORD_AUTH
              </option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Saved Profiles
          </h3>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center space-x-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>

        {configs.length === 0 ? (
          <p className="text-slate-500">No saved configurations</p>
        ) : (
          <div className="space-y-2">
            {configs.map((config) => (
              <div
                key={config.name}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  activeConfig?.name === config.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => handleLoad(config)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {config.name}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {config.region} • {config.userPoolId}
                    </p>
                  </div>
                  {activeConfig?.name === config.name && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-500 bg-opacity-75">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Clear All Data
            </h3>
            <p className="text-slate-600 mb-4">
              This will permanently delete all saved configurations and sign out
              any authenticated user. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
