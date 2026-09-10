// src/components/AddMilestoneModal.tsx
import React, { useState } from 'react';

interface AddMilestoneModalProps {
    caseId: string;
    token: string;
    onSuccess: () => void;
    onClose: () => void;
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
    caseId,
    token,
    onSuccess,
    onClose,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/v1/cases/${caseId}/milestones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    event_date: eventDate ? new Date(eventDate).toISOString() : null,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create milestone: ${text}`);
            }

            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create milestone.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-100">Add New Milestone</h2>
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
                            Milestone Title
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Initial Police Report Filed"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Event Date
                        </label>
                        <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none text-slate-300"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Description / Summary
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Provide context regarding this milestone event..."
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
                        {loading ? 'Creating Milestone...' : 'Save Milestone'}
                    </button>
                </form>
            </div>
        </div>
    );
};