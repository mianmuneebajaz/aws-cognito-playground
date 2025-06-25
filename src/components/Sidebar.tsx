import React from "react";
import {
  Settings,
  LogIn,
  UserPlus,
  KeyRound,
  Shield,
  Bug,
  Database,
  Github,
  Linkedin,
} from "lucide-react";
import { TabType } from "../types";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "config" as TabType, label: "Configuration", icon: Settings },
  { id: "login" as TabType, label: "Login", icon: LogIn },
  { id: "register" as TabType, label: "Register", icon: UserPlus },
  { id: "forgot" as TabType, label: "Forgot Password", icon: KeyRound },
  { id: "otp" as TabType, label: "OTP / MFA", icon: Shield },
  { id: "debug" as TabType, label: "Debug Console", icon: Bug },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-slate-900 h-full flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Cognito Debug</h1>
            <p className="text-sm text-slate-400">AWS Authentication Tool</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="text-xs text-slate-500">
          <p>Amplify v6.15.1</p>
          <p>Data stored locally</p>
        </div>

        <div className="border-t border-slate-700 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Developed by{" "}
              <span className="text-slate-300 font-medium">Muneeb Ajaz</span>
            </span>
            <div className="flex items-center space-x-2">
              <a
                href="https://github.com/mianmuneebajaz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                title="GitHub Profile"
              >
                <Github className="w-3 h-3" />
              </a>
              <a
                href="https://linkedin.com/in/mianmuneebajaz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
