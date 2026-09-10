import React, { useState } from 'react';

interface LoginFormProps {
    onLoginSuccess: (token: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const endpoint = isRegistering
            ? '/api/v1/users/register'
            : '/api/v1/users/login';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');

            if (!response.ok) {
                let errorMessage = `Server error (${response.status})`;
                if (isJson) {
                    const errData = await response.json();
                    errorMessage = errData.error || errorMessage;
                } else {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.token) {
                onLoginSuccess(data.token);
            } else {
                throw new Error('No authentication token received from server.');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">

            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-1">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                    {isRegistering ? 'Create an Account' : 'Sign in to Case Chronicle'}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                    {isRegistering ? 'Register to submit media analysis & timelines' : 'Access full case notes and management tools'}
                </p>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-2.5">
                    <svg width="20" height="20" className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="investigator@example.com"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
                >
                    {loading ? (
                        <>
                            <svg width="16" height="16" className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Authenticating...
                        </>
                    ) : (
                        isRegistering ? 'Register Account' : 'Sign In'
                    )}
                </button>
            </form>

            {/* Switch between Login and Register */}
            <div className="pt-4 border-t border-slate-800/80 text-center">
                <button
                    type="button"
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-blue-400 transition-colors underline cursor-pointer"
                >
                    {isRegistering
                        ? 'Already have an account? Sign in here'
                        : "Don't have an account? Register here"}
                </button>
            </div>

        </div>
    );
};