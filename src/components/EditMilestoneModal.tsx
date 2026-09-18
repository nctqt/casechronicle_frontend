import React, { useState } from 'react';
import type { Milestone } from '../types';
import { updateMilestoneTitle, updateMilestoneDescription, updateMilestoneEventDate } from '../api';

interface EditMilestoneModalProps {
    milestone: Milestone;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditMilestoneModal: React.FC<EditMilestoneModalProps> = ({ milestone, token, onClose, onSuccess }) => {
    const [title, setTitle] = useState(milestone.title);
    const [description, setDescription] = useState(milestone.description || '');
    const [eventDate, setEventDate] = useState(
        milestone.event_date ? milestone.event_date.split('T')[0] : ''
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await Promise.all([
                updateMilestoneTitle(milestone.id, title, token),
                updateMilestoneDescription(milestone.id, description ? description : '', token),
                updateMilestoneEventDate(milestone.id, eventDate ? eventDate : '', token),
            ]);

            onSuccess();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error updating milestone.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl text-slate-100">
                <h3 className="text-xl font-bold mb-4">Edit Milestone</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Event Date</label>
                        <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};