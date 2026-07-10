/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Camera, 
  Radio, 
  Wifi, 
  LayoutDashboard, 
  Menu, 
  X,
  Lock,
  ChevronRight,
  Info
} from "lucide-react";
import { TabType } from "./types";
import Dashboard from "./components/Dashboard";
import AiScanner from "./components/AiScanner";
import LensFilter from "./components/LensFilter";
import EmfMeter from "./components/EmfMeter";
import NetworkGuide from "./components/NetworkGuide";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Tổng Quan", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "ai-scanner", label: "Quét Thấu Kính AI", icon: <Cpu className="h-4 w-4" /> },
    { id: "lens-filter", label: "Bộ Lọc Phản Quang", icon: <Camera className="h-4 w-4" /> },
    { id: "emf-meter", label: "Từ Trường EMF", icon: <Radio className="h-4 w-4" /> },
    { id: "network-guide", label: "Rà Quét Wi-Fi", icon: <Wifi className="h-4 w-4" /> },
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case "ai-scanner":
        return <AiScanner />;
      case "lens-filter":
        return <LensFilter />;
      case "emf-meter":
        return <EmfMeter />;
      case "network-guide":
        return <NetworkGuide />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const getTabColor = (id: string) => {
    switch (id) {
      case "dashboard": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "ai-scanner": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "lens-filter": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      case "emf-meter": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "network-guide": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  const currentTabInfo = menuItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300" id="main-app-container">
      
      {/* Dynamic light effects in background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo brand */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer" 
              onClick={() => setActiveTab("dashboard")}
              id="app-logo"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/10">
                <ShieldCheck className="h-5.5 w-5.5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">CAMERA DETECTOR</span>
                <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase block -mt-1">ANTI-SPY PRO</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" id="desktop-nav">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                    activeTab === item.id
                      ? `${getTabColor(item.id)} shadow-sm`
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white transition-all"
                id="btn-mobile-menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-800/80 bg-[#070b14]/95 backdrop-blur-md overflow-hidden z-30"
            id="mobile-nav-drawer"
          >
            <div className="px-4 py-3 space-y-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${
                    activeTab === item.id
                      ? `${getTabColor(item.id)}`
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10" id="main-content-layout">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {renderActiveComponent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer copyright info */}
      <footer className="border-t border-slate-900 bg-[#05080e] py-6 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Quyền riêng tư của bạn là ưu tiên tuyệt đối</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider">
            © 2026 Camera Detector Anti-Spy. Phát triển bằng Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
}
