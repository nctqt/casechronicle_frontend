// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';

interface UnlinkedVideo {
    id: string;
    youtube_video_id: string;
    title: string;
    channel_name?: string;
    description?: string;
    ai_summary?: string;
    category?: string;
    status: string;
    summary_source?: string;
    estimated_event_date?: string;
    created_at: string;
    milestone_id?: string | null;

}

interface AdminDashboardProps {
    token: string;
    cases: Array<{ id: string; title: string }>;
    setCases: React.Dispatch<React.SetStateAction<Array<{ id: string; title: string }>>>; // Move them here!
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, cases, setCases }) => {
    const [videos, setVideos] = useState<UnlinkedVideo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCases, setSelectedCases] = useState<Record<string, string>>({});
    const [milestonesByCase, setMilestonesByCase] = useState<Record<string, Array<{ id: string; title: string }>>>({});
    const [milestoneFormCaseId, setMilestoneFormCaseId] = useState<string>('');
    const [milestoneTitle, setMilestoneTitle] = useState<string>('');
    const [milestoneDescription, setMilestoneDescription] = useState<string>('');
    const [milestoneDate, setMilestoneDate] = useState<string>('');

    interface AdminDashboardProps {
        token: string;
        cases: Array<{ id: string; title: string }>;
        setCases: React.Dispatch<React.SetStateAction<Array<{ id: string; title: string }>>>;
    }

    useEffect(() => {
        loadAllVideos();
    }, [token]);

    const handleCreateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!milestoneFormCaseId || !milestoneTitle.trim()) {
            alert('Please select a case and enter a milestone title.');
            return;
        }

        try {
            const res = await fetch(`/api/v1/cases/${milestoneFormCaseId}/milestones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: milestoneTitle.trim(),
                    description: milestoneDescription.trim(),
                    estimated_date: milestoneDate ? new Date(milestoneDate).toISOString() : undefined,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create milestone: ${text}`);
            }

            // Reset form fields
            setMilestoneTitle('');
            setMilestoneDescription('');
            setMilestoneDate('');

            // Refresh local milestone cache for this case if loaded
            const updatedMilestonesRes = await fetch(`/api/v1/cases/${milestoneFormCaseId}/milestones`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (updatedMilestonesRes.ok) {
                const data = await updatedMilestonesRes.json();
                setMilestonesByCase(prev => ({ ...prev, [milestoneFormCaseId]: data || [] }));
            }

            alert('Milestone successfully created!');
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error creating milestone.');
        }
    };

    const handleCaseSelection = async (videoId: string, caseId: string) => {
        setSelectedCases(prev => ({ ...prev, [videoId]: caseId }));
        try {
            const res = await fetch(`/api/v1/cases/${caseId}/milestones`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMilestonesByCase(prev => ({ ...prev, [caseId]: data || [] }));
            }
        } catch (err) {
            console.error("Failed to load milestones for case", err);
        }
    };

    const handleLinkVideoToMilestone = async (videoId: string, milestoneId: string) => {
        try {
            const selectElement = document.getElementById(`milestone-select-${videoId}`) as HTMLSelectElement;
            if (selectElement) selectElement.disabled = true;

            const res = await fetch(`/api/v1/milestones/${milestoneId}/videos/${videoId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to link video: ${text}`);
            }

            loadAllVideos();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error linking video.');
            const selectElement = document.getElementById(`milestone-select-${videoId}`) as HTMLSelectElement;
            if (selectElement) selectElement.disabled = false;
        }
    };

    const loadAllVideos = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/v1/videos', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to fetch media library: ${text}`);
            }

            const data = await res.json();
            setVideos(data || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error loading media library.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCase = async (caseId: string, caseTitle: string) => {
        if (!window.confirm(`Are you sure you want to delete "${caseTitle}"? This will remove all associated milestones and unhook any linked media.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/v1/cases/${caseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to delete case: ${text}`);
            }

            // Remove the deleted case from the parent's state (updates both Admin and Timeline header instantly)
            setCases(prevCases => prevCases.filter(c => c.id !== caseId));

            // Refresh the video list so newly unlinked videos appear in the queue instantly
            loadAllVideos();

            alert('Case successfully deleted.');
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error deleting case.');
        }
    };

    const handleEnrichVideo = async (videoId: string) => {
        try {
            const res = await fetch(`/api/v1/videos/${videoId}/enrich`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to start AI enrichment: ${text}`);
            }

            // 1. Optimistically update this specific video's status locally
            setVideos(prevVideos =>
                prevVideos.map(v => v.id === videoId ? { ...v, status: 'analyzing' } : v)
            );

            // 2. Poll *only* this single video's endpoint until the summary populates
            const pollSingleVideo = async (attemptsRemaining: number) => {
                if (attemptsRemaining <= 0) return;

                setTimeout(async () => {
                    try {
                        const singleRes = await fetch(`/api/v1/videos/${videoId}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });

                        if (singleRes.ok) {
                            const updatedVideo = await singleRes.json();

                            // If it's still analyzing or lacks a summary, check again
                            if (updatedVideo.status === 'analyzing' || !updatedVideo.ai_summary) {
                                pollSingleVideo(attemptsRemaining - 1);
                                return;
                            }

                            // 3. Seamlessly patch just this video into state without touching the rest of the list
                            setVideos(prevVideos =>
                                prevVideos.map(v => v.id === videoId ? updatedVideo : v)
                            );
                        }
                    } catch (err) {
                        console.error("Error polling single video update:", err);
                    }
                }, 5000); // Check every 5 seconds
            };

            // Kick off background checks (tries up to 5 times = 25 seconds max)
            pollSingleVideo(5);

        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error triggering AI enrichment.');
        }
    };

    const handleVideoCategoryChange = async (videoId: string, newCategory: string) => {
        setVideos(videos.map(v => v.id === videoId ? { ...v, category: newCategory } : v));

        try {
            const res = await fetch(`/api/v1/videos/${videoId}/category`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ category: newCategory }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to update category: ${text}`);
            }
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error updating category.');
            loadAllVideos();
        }
    };

    const handleVideoStatusChange = async (videoId: string, newStatus: string) => {
        setVideos(videos.map(v => v.id === videoId ? { ...v, status: newStatus } : v));

        try {
            const res = await fetch(`/api/v1/videos/${videoId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to update status: ${text}`);
            }
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error updating status.');
            loadAllVideos();
        }
    };

    const [youtubeInput, setYoutubeInput] = useState('');

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!youtubeInput.trim()) return;

        try {
            const res = await fetch('/api/v1/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ url: youtubeInput.trim() }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to add video: ${text}`);
            }

            setYoutubeInput('');
            loadAllVideos();
            alert('Video successfully added to the queue!');
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error adding video.');
        }
    };

    const unlinkedVideos = videos.filter(v => !v.milestone_id);
    const unenrichedLinkedVideos = videos.filter(v =>
        v.milestone_id &&
        (!v.ai_summary || !v.summary_source || v.summary_source === 'none' || v.summary_source === '')
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-slate-400">
                <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Loading media library...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm my-4">
                <span className="font-semibold">Dashboard Error:</span> {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Section: Unlinked Media Staging Queue */}
            {/* Milestone Creation Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                <div>
                    <h3 className="text-base font-bold text-slate-100">Create New Milestone</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Add a chronological milestone node to an existing case timeline.
                    </p>
                </div>

                <form onSubmit={handleCreateMilestone} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                        value={milestoneFormCaseId}
                        onChange={(e) => setMilestoneFormCaseId(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                        required
                    >
                        <option value="" disabled>Select Target Case...</option>
                        {cases?.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Milestone Title..."
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                        required
                    />

                    <input
                        type="date"
                        value={milestoneDate}
                        onChange={(e) => setMilestoneDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />

                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                    >
                        Create Milestone
                    </button>
                </form>
            </div>
            <form onSubmit={handleAddVideo} className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Paste YouTube URL to ingest new media..."
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                >
                    Add Video
                </button>
            </form>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">Unlinked Media Queue</h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Orphaned videos not currently assigned to any milestone timeline.
                    </p>
                </div>
                <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-lg">
                    Total: {unlinkedVideos.length}
                </span>
            </div>

            {unlinkedVideos.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg text-sm">
                    No unlinked media found in the queue.
                </div>
            ) : (
                <div className="space-y-3">
                    {unlinkedVideos.map((video) => (
                        <div
                            key={video.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start shadow-xl hover:border-slate-700 transition-colors"
                        >
                            <div className="lg:col-span-2 space-y-2 min-w-0">
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <h4 className="text-sm font-medium text-slate-200 truncate">
                                        {video.title || video.youtube_video_id}
                                    </h4>
                                    {video.channel_name && (
                                        <span className="text-xs text-slate-400 shrink-0">
                                            • {video.channel_name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                    {video.estimated_event_date && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-800/60 text-blue-300">
                                            Event Date: {(() => {
                                                const val = video.estimated_event_date;
                                                const dateStr = typeof val === 'object' && val !== null && 'Time' in val
                                                    ? (val as { Time: string }).Time
                                                    : String(val);
                                                return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                                            })()}
                                        </span>
                                    )}

                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${video.summary_source && video.summary_source !== 'metadata'
                                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                                        : 'bg-amber-950/50 border-amber-800/60 text-amber-300'
                                        }`}>
                                        Source: {video.ai_summary ? (video.summary_source || 'metadata') : 'none'}
                                    </span>

                                    <select
                                        value={video.category || 'general'}
                                        onChange={(e) => handleVideoCategoryChange(video.id, e.target.value)}
                                        className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none cursor-pointer"
                                        title="Change Category"
                                    >
                                        <option value="interview">Interview</option>
                                        <option value="news">News Broadcast</option>
                                        <option value="bodycam">Bodycam / Footage</option>
                                        <option value="analysis">Creator Analysis</option>
                                        <option value="general">General</option>
                                    </select>

                                    <select
                                        value={video.status || 'pending_review'}
                                        onChange={(e) => handleVideoStatusChange(video.id, e.target.value)}
                                        className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none cursor-pointer"
                                        title="Change Pipeline Status"
                                    >
                                        <option value="pending_review">Pending Review</option>
                                        <option value="analyzed">Analyzed</option>
                                        <option value="analyzing">Analyzing</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                {(video.ai_summary || video.description) && (
                                    <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/60 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                        <span className="font-semibold text-slate-300">Summary:</span> {video.ai_summary}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col justify-between h-full gap-3">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleEnrichVideo(video.id)}
                                        className="px-2.5 py-1 text-xs font-medium bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/80 rounded transition-colors cursor-pointer"
                                        title="Trigger AI summary enrichment pipeline"
                                    >
                                        Enrich via AI
                                    </button>
                                    <a
                                        href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
                                    >
                                        <span>Watch</span>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>

                                <div className="bg-slate-950/60 border border-slate-800/80 rounded p-2 flex flex-col gap-1.5">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Attach to Milestone</span>
                                    <select
                                        onChange={(e) => handleCaseSelection(video.id, e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-1 focus:border-blue-500 focus:outline-none w-full"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Case...</option>
                                        {cases.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                    <select
                                        id={`milestone-select-${video.id}`}
                                        disabled={!selectedCases[video.id]}
                                        onChange={(e) => handleLinkVideoToMilestone(video.id, e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-1 focus:border-blue-500 focus:outline-none w-full disabled:opacity-40 disabled:cursor-not-allowed"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Milestone...</option>
                                        {(milestonesByCase[selectedCases[video.id]] || []).map(m => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Section: Active/Linked Enrichment Queue */}
            <div className="space-y-6 mt-10 border-t border-slate-800 pt-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">Enrichment Queue</h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Active milestone-linked videos missing AI summaries or metadata sources that require processing.
                        </p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-mono rounded-lg">
                        Needs Review: {unenrichedLinkedVideos.length}
                    </span>
                </div>

                {unenrichedLinkedVideos.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-lg text-xs">
                        All active milestone videos have been enriched!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {unenrichedLinkedVideos.map((video) => (
                            <div
                                key={video.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start shadow-xl hover:border-slate-700 transition-colors"
                            >
                                <div className="lg:col-span-2 space-y-2 min-w-0">
                                    <div className="flex items-baseline gap-2 min-w-0">
                                        <h4 className="text-sm font-medium text-slate-200 truncate">
                                            {video.title || video.youtube_video_id}
                                        </h4>
                                        {video.channel_name && (
                                            <span className="text-xs text-slate-400 shrink-0">
                                                • {video.channel_name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                        {video.estimated_event_date && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-800/60 text-blue-300">
                                                Event Date: {(() => {
                                                    const val = video.estimated_event_date;
                                                    const dateStr = typeof val === 'object' && val !== null && 'Time' in val
                                                        ? (val as { Time: string }).Time
                                                        : String(val);
                                                    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                                                })()}
                                            </span>
                                        )}

                                        <span className="text-[10px] px-1.5 py-0.5 rounded border bg-amber-950/50 border-amber-800/60 text-amber-300">
                                            Source: {video.summary_source || 'none'}
                                        </span>

                                        <select
                                            value={video.category || 'general'}
                                            onChange={(e) => handleVideoCategoryChange(video.id, e.target.value)}
                                            className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none cursor-pointer"
                                            title="Change Category"
                                        >
                                            <option value="interview">Interview</option>
                                            <option value="news">News Broadcast</option>
                                            <option value="bodycam">Bodycam / Footage</option>
                                            <option value="analysis">Creator Analysis</option>
                                            <option value="general">General</option>
                                        </select>

                                        <select
                                            value={video.status || 'pending_review'}
                                            onChange={(e) => handleVideoStatusChange(video.id, e.target.value)}
                                            className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none cursor-pointer"
                                            title="Change Pipeline Status"
                                        >
                                            <option value="pending_review">Pending Review</option>
                                            <option value="analyzed">Analyzed</option>
                                            <option value="analyzing">Analyzing</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>

                                    {(video.ai_summary || video.description) && (
                                        <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/60 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                            <span className="font-semibold text-slate-300">Summary:</span> {video.ai_summary || video.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2 lg:justify-self-end">
                                    <button
                                        onClick={() => handleEnrichVideo(video.id)}
                                        className="px-2.5 py-1 text-xs font-medium bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/80 rounded transition-colors cursor-pointer"
                                        title="Trigger AI summary enrichment pipeline"
                                    >
                                        Enrich via AI
                                    </button>
                                    <a
                                        href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
                                    >
                                        <span>Watch</span>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>{/* Case Management / Deletion Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                <div>
                    <h3 className="text-base font-bold text-slate-100">Manage Cases</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Select an existing case to delete it and automatically unlink its associated media.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        id="case-delete-select"
                        className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                        defaultValue=""
                    >
                        <option value="" disabled>Select case to delete...</option>
                        {cases.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => {
                            const selectElement = document.getElementById('case-delete-select') as HTMLSelectElement;
                            const selectedCaseId = selectElement?.value;
                            if (!selectedCaseId) {
                                alert('Please select a case to delete first.');
                                return;
                            }
                            const targetCase = cases.find(c => c.id === selectedCaseId);
                            if (targetCase) {
                                handleDeleteCase(targetCase.id, targetCase.title);
                                selectElement.value = ''; // Reset dropdown after action
                            }
                        }}
                        className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                    >
                        Delete Selected Case
                    </button>
                </div>
            </div>

        </div>
    );
};