import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { ProfileCard } from "./components/ProfileCard";
import { ConfigurationTab } from "./components/tabs/ConfigurationTab";
import { LoginTab } from "./components/tabs/LoginTab";
import { RegisterTab } from "./components/tabs/RegisterTab";
import { ForgotPasswordTab } from "./components/tabs/ForgotPasswordTab";
import { OTPTab } from "./components/tabs/OTPTab";
import { DebugTab } from "./components/tabs/DebugTab";
import { Modal } from "./components/Modal";
import { TokenViewer } from "./components/TokenViewer";
import { TabType, CognitoConfig } from "./types";
import { useUserState } from "./hooks/useUserState";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("config");
  const [activeConfig, setActiveConfig] = useState<CognitoConfig | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const { userState, updateUserState } = useUserState();

  const handleEnterTool = () => {
    setShowLanding(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "config":
        return (
          <ConfigurationTab
            onConfigChange={setActiveConfig}
            activeConfig={activeConfig}
            onUserStateChange={updateUserState}
          />
        );
      case "login":
        return (
          <LoginTab
            onUserStateChange={updateUserState}
            activeConfigName={activeConfig?.name || null}
          />
        );
      case "register":
        return <RegisterTab activeConfigName={activeConfig?.name || null} />;
      case "forgot":
        return (
          <ForgotPasswordTab activeConfigName={activeConfig?.name || null} />
        );
      case "otp":
        return <OTPTab activeConfigName={activeConfig?.name || null} />;
      case "debug":
        return <DebugTab />;
      default:
        return (
          <ConfigurationTab
            onConfigChange={setActiveConfig}
            activeConfig={activeConfig}
            onUserStateChange={updateUserState}
          />
        );
    }
  };

  if (showLanding) {
    return <LandingPage onEnterTool={handleEnterTool} />;
  }

  return (
    <>
      <div className="flex h-screen bg-slate-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userState={userState}
            activeConfig={activeConfig}
            onUserStateChange={updateUserState}
          />

          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6">
              <div
                className={`mx-auto ${
                  userState.isSignedIn ? "max-w-4xl" : "max-w-6xl"
                }`}
              >
                {renderTabContent()}
              </div>
            </main>

            {userState.isSignedIn && (
              <ProfileCard
                userState={userState}
                onUserStateChange={updateUserState}
                onViewTokens={() => setShowTokenModal(true)}
              />
            )}
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
}

export default App;
