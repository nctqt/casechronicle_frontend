import React, { useState } from 'react';
import { CaseTimeline } from './components/CaseTimeline';
import { LoginForm } from './components/LoginForm';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('token');
    return (saved && saved !== 'undefined' && saved !== 'null') ? saved : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Default case ID or active case in view
  const activeCaseId = 'c8bbf1a4-ecb6-4e8a-869a-de8e02489a86';

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">

          {/* App Title / Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
              TC
            </div>
            <span className="font-bold text-slate-100 tracking-tight text-lg">
              True Crime Time Capsule
            </span>
          </div>

          {/* Dynamic Auth Button */}
          <div>
            {token ? (
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area (Accessible whether logged in or out) */}
      <main className="flex-1 py-8 px-4">
        <CaseTimeline caseId={activeCaseId} token={token || ''} />
      </main>

      {/* Modal Overlay for Login / Register */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            {/* Close button in top-right of modal */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute right-4 top-4 z-10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800/60"
              aria-label="Close modal"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};