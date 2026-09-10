// src/App.tsx
import React, { useState, useEffect } from 'react';
import { CaseTimeline } from './components/CaseTimeline';
import { AddCaseModal } from './components/AddCaseModal';
import { LoginForm } from './components/LoginForm';
import { parseJwt } from './utils/auth';
import { AdminDashboard } from './components/AdminDashboard';

interface CaseItem {
  id: string;
  title: string;
  description?: string;
}

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [isAddCaseOpen, setIsAddCaseOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'timeline' | 'admin'>('timeline');
  const [cases, setCases] = useState<CaseItem[]>([]);

  const claims = parseJwt(token);
  const isAdmin = claims?.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    window.location.reload();
  };

  const loadCases = async () => {
    try {
      // Include authorization token if required by your backend routes, 
      // or keep it public if your GET cases endpoint is public.
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/cases', { headers });
      if (res.ok) {
        const data = await res.json();
        setCases(data || []);
        if (data.length > 0 && !selectedCaseId) {
          setSelectedCaseId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load cases list:', err);
    }
  };

  useEffect(() => {
    loadCases();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-100">True Crime Time Capsule</h1>

          {/* Case Selector Dropdown (Available to everyone) */}
          {cases.length > 0 && (
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={() => setCurrentView(currentView === 'admin' ? 'timeline' : 'admin')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            {currentView === 'admin' ? 'View Timeline' : 'Admin Dashboard'}
          </button>
        )}

        {/* Right side: Auth & Admin Actions */}
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
              >
                Log Out
              </button>

              {isAdmin && (
                <button
                  onClick={() => setIsAddCaseOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
                >
                  + New Case
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
            >
              Log In
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto">
        {currentView === 'admin' ? (
          <AdminDashboard
            token={token || ''}
            cases={cases}
            setCases={setCases}
          />
        ) : selectedCaseId ? (
          <CaseTimeline caseId={selectedCaseId} token={token || ''} />
        ) : (
          <div className="text-center py-12 text-slate-500">
            No cases available.
          </div>
        )}
      </main>

      {/* Add Case Modal (Admin Only) */}
      {isAddCaseOpen && (
        <AddCaseModal
          token={token || ''}
          onClose={() => setIsAddCaseOpen(false)}
          onSuccess={(newCaseId) => {
            setIsAddCaseOpen(false);
            loadCases().then(() => {
              if (newCaseId) setSelectedCaseId(newCaseId);
            });
          }}
        />
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full relative">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-sm font-bold z-10 cursor-pointer"
            >
              ✕
            </button>
            <LoginForm
              onLoginSuccess={(newToken) => {
                localStorage.setItem('token', newToken);
                setToken(newToken);
                setIsLoginOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;