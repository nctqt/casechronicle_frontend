// src/components/AddCaseModal.tsx
import React, { useState } from 'react';

interface AddCaseModalProps {
    token: string;
    onSuccess: (newCaseId?: string) => void;
    onClose: () => void;
}

export const AddCaseModal: React.FC<AddCaseModalProps> = ({
    token,
    onSuccess,
    onClose,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/v1/cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create case: ${text}`);
            }

            const data = await res.json();
            // Pass created case ID back if handler returns it
            onSuccess(data?.id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create case.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-100">Create New Case</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 text-sm font-semibold cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Case Title
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., The Disappearance of..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Summary / Overview
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Brief overview of the case background..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                        {loading ? 'Creating Case...' : 'Create Case'}
                    </button>
                </form>
            </div>
        </div>
    );
};