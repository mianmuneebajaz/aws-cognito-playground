import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  LogOut,
  Settings,
  Copy,
  RefreshCw,
  Crown,
  Calendar,
  MapPin,
  Activity,
} from "lucide-react";
import { UserState } from "../types";
import { signOut } from "aws-amplify/auth";
import { withLogging } from "../utils/apiLogger";

interface ProfileCardProps {
  userState: UserState;
  onUserStateChange: () => void;
  onViewTokens: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  userState,
  onUserStateChange,
  onViewTokens,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await withLogging("signOut", {}, () => signOut());
      onUserStateChange();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerificationStatus = (attribute: string) => {
    return userState.attributes?.[`${attribute}_verified`] === "true";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getMFAStatus = () => {
    if (!userState.mfaPreference) {
      return { enabled: false, methods: [], preferred: null };
    }

    const enabledMethods = userState.mfaPreference.enabled || [];
    const preferredMethod = userState.mfaPreference.preferred || null;

    return {
      enabled: enabledMethods.length > 0,
      methods: enabledMethods,
      preferred: preferredMethod,
    };
  };

  if (!userState.isSignedIn) {
    return null;
  }

  return (
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
      {/* Profile Card */}
      <div
        className={`m-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-lg transition-all duration-500 ${
          isHovered ? "shadow-2xl scale-[1.02] border-blue-200" : "shadow-lg"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header with Avatar */}
        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-t-2xl" />

          <div className="relative flex items-center space-x-4">
            <div
              className={`relative transition-transform duration-300 ${
                isHovered ? "scale-110" : ""
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {getInitials(userState.username || userState.email)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">
                {userState.attributes?.name || userState.username || "User"}
              </h2>
              <p className="text-sm text-slate-600 truncate flex items-center">
                <User className="w-3 h-3 mr-1" />@{userState.username}
              </p>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="px-6 pb-4 space-y-4">
          {/* Email Section */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {userState.email}
                </div>
                <div className="flex items-center space-x-1">
                  {getVerificationStatus("email") ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-600">Not verified</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(userState.email || "", "email")}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
            >
              {copiedField === "email" ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          {/* Phone Section */}
          {userState.attributes?.phone_number && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {userState.attributes.phone_number}
                  </div>
                  <div className="flex items-center space-x-1">
                    {getVerificationStatus("phone_number") ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600">
                          Not verified
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    userState.attributes?.phone_number || "",
                    "phone"
                  )
                }
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                {copiedField === "phone" ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>
          )}

          {/* MFA Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3 flex-1">
              <Shield className="w-4 h-4 text-slate-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">
                  Multi-Factor Authentication
                </div>
                <div className="flex items-center space-x-1">
                  {getMFAStatus().enabled ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">Enabled</span>
                      {getMFAStatus().preferred && (
                        <span className="text-xs text-slate-500">
                          ({getMFAStatus().preferred})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600">Disabled</span>
                    </>
                  )}
                </div>
                {getMFAStatus().enabled &&
                  getMFAStatus().methods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getMFAStatus().methods.map((method) => (
                        <span
                          key={method}
                          className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Account Details
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-slate-500">Created</div>
                <div className="font-medium text-slate-900">
                  {formatDate(userState.attributes?.created_at)}
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-slate-500">Updated</div>
                <div className="font-medium text-slate-900">
                  {formatDate(userState.attributes?.updated_at)}
                </div>
              </div>
            </div>

            {userState.attributes?.locale && (
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-slate-500 text-xs">Locale</div>
                <div className="font-medium text-slate-900 text-sm flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {userState.attributes.locale}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onViewTokens}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>Tokens</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-xs bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 text-center">
        <div className="text-xs text-slate-500">
          Secure session • AWS Cognito
        </div>
      </div>
    </div>
  );
};
