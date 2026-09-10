// src/components/AddVideoModal.tsx
import React, { useState } from 'react';

interface AddVideoModalProps {
    caseId: string;
    milestoneId: string;
    token: string;
    onSuccess: () => void;
    onClose: () => void;
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
    caseId,
    milestoneId,
    token,
    onSuccess,
    onClose,
}) => {
    const [rawUrl, setRawUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract YouTube ID from URL or return raw value
    const extractYoutubeId = (url: string): string => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const youtubeVideoId = extractYoutubeId(rawUrl);

        try {
            const res = await fetch('/api/v1/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    url: rawUrl,
                    youtube_video_id: youtubeVideoId,
                    milestone_id: milestoneId,
                    case_id: caseId,
                    summary,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create video: ${text}`);
            }

            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to add video.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-100">Add YouTube Video</h2>
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
                            YouTube Video URL
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={rawUrl}
                            onChange={(e) => setRawUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Custom Notes / Summary (Optional)
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Brief context or commentary for this media segment..."
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                        {loading ? 'Saving Video...' : 'Save Video to Timeline'}
                    </button>
                </form>
            </div>
        </div>
    );
};