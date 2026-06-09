import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-[#121212] overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col min-w-0">
        {/* Subtle top header bar to replicate professional SaaS */}
        <header className="h-11 border-b border-[#2e2e2e] bg-[#161616] flex items-center justify-between px-6 flex-shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#2a2a2a] text-[#888] border border-[#3c3c3c] px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Recruitment Console
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#666] font-mono">
              TalentBridge v1.0.0
            </span>
          </div>
        </header>

        {/* Dynamic page contents wrapper */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#121212] min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
