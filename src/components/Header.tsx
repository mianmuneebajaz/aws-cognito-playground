import React, { useState } from "react";
import { User, AlertTriangle, CheckCircle, LogOut, Eye } from "lucide-react";
import { signOut } from "aws-amplify/auth";
import { UserState, CognitoConfig } from "../types";
import { withLogging } from "../utils/apiLogger";
import { Modal } from "./Modal";
import { TokenViewer } from "./TokenViewer";

interface HeaderProps {
  userState: UserState;
  activeConfig: CognitoConfig | null;
  onUserStateChange: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userState,
  activeConfig,
  onUserStateChange,
}) => {
  const [showTokenModal, setShowTokenModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await withLogging("signOut", {}, () => signOut());
      onUserStateChange();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-900">
                {userState.isSignedIn ? (
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>
                      Signed in as {userState.email || userState.username}
                    </span>
                    {userState.tokens && (
                      <button
                        onClick={() => setShowTokenModal(true)}
                        className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Tokens</span>
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                    <span>Not signed in</span>
                  </span>
                )}
              </span>
            </div>

            {activeConfig && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">
                  Profile: {activeConfig.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!activeConfig && (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  No configuration active
                </span>
              </div>
            )}

            <div className="text-sm text-slate-500">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title="Current Session Tokens"
        size="lg"
      >
        {userState.tokens && <TokenViewer tokens={userState.tokens} />}
      </Modal>
    </>
  );
};
