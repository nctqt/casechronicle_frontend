// src/components/CaseTimeline.tsx
import ReactPlayer from 'react-player';
import React, { useState, useEffect } from 'react';
import type { CaseTimelineResponse } from '../types';
import { fetchCaseTimeline } from '../api';
import { parseJwt } from '../utils/auth';
import { AddVideoModal } from './AddVideoModal';
import { AddMilestoneModal } from './AddMilestoneModal';

interface CaseTimelineProps {
    caseId: string;
    token: string;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ caseId, token }) => {
    const [timeline, setTimeline] = useState<CaseTimelineResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeMilestoneForVideo, setActiveMilestoneForVideo] = useState<string | null>(null);
    const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState<boolean>(false);

    // Extract role from token
    const claims = parseJwt(token);
    const isAdmin = claims?.role === 'admin';

    // Inside src/components/CaseTimeline.tsx

    const handleDeleteMilestone = async (milestoneId: string) => {
        try {
            const res = await fetch(`/api/v1/milestones/${milestoneId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to delete milestone: ${text}`);
            }

            loadTimeline();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error deleting milestone.');
        }
    };

    const handleUnlinkVideo = async (milestoneId: string, videoId: string) => {
        try {
            const res = await fetch(`/api/v1/milestones/${milestoneId}/videos/${videoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to unlink video: ${text}`);
            }

            loadTimeline();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error unlinking video.');
        }
    };

    const handleDeleteEntireVideo = async (videoId: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this video from the system?')) return;

        try {
            const res = await fetch(`/api/v1/videos/${videoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to delete video: ${text}`);
            }

            loadTimeline();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error deleting video.');
        }
    };

    const handleVideoCategoryChange = async (videoId: string, newCategory: string) => {
        if (timeline) {
            const updatedMilestones = timeline.milestones.map((milestone) => ({
                ...milestone,
                videos: milestone.videos?.map((video) =>
                    video.id === videoId ? { ...video, category: newCategory } : video
                ),
            }));
            setTimeline({ ...timeline, milestones: updatedMilestones });
        }

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
                throw new Error(`Failed to update video category: ${text}`);
            }
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error updating video category.');
            loadTimeline();
        }
    };

    const handleVideoStatusChange = async (videoId: string, newStatus: string) => {
        if (timeline) {
            const updatedMilestones = timeline.milestones.map((milestone) => ({
                ...milestone,
                videos: milestone.videos?.map((video) =>
                    // Cast newStatus as any (or your exact VideoStatus type) to satisfy TypeScript
                    video.id === videoId ? { ...video, status: newStatus as any } : video
                ),
            }));
            setTimeline({ ...timeline, milestones: updatedMilestones });
        }

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
                throw new Error(`Failed to update video status: ${text}`);
            }
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error updating video status.');
            loadTimeline();
        }
    };

    const loadTimeline = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchCaseTimeline(caseId, token || '');
            setTimeline(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load timeline.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            setError('Missing case ID.');
            return;
        }

        loadTimeline();
    }, [caseId, token]);

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'analyzed':
                return (
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-emerald-900/80 text-emerald-300 border border-emerald-700 rounded">
                        Analyzed
                    </span>
                );
            case 'analyzing':
            case 'pending_review':
                return (
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-amber-900/80 text-amber-300 border border-amber-700 rounded animate-pulse">
                        Processing
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-red-900/80 text-red-300 border border-red-700 rounded">
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded">
                        {status}
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-400">
                <svg className="animate-spin h-6 w-6 mr-3 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Fetching case timeline...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300 my-4">
                <h3 className="font-semibold text-red-200">Unable to load timeline</h3>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    if (!timeline) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl">
            {/* Case Header */}
            <div className="border-b border-slate-800 pb-4 mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-50">{timeline.case.title}</h1>
                    {timeline.case.description && (
                        <p className="text-slate-400 mt-2 text-base leading-relaxed">
                            {timeline.case.description}
                        </p>
                    )}
                </div>

                {/* Admin Action: Add Milestone */}
                {isAdmin && (
                    <button
                        onClick={() => setIsAddMilestoneOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer shrink-0"
                    >
                        + Add Milestone
                    </button>
                )}
            </div>

            {timeline.milestones.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No milestones recorded for this case yet.
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
                    {timeline.milestones.map((milestone) => (
                        <div key={milestone.id} className="relative">
                            <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-blue-500 rounded-full border-4 border-slate-900" />
                            <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700/60 shadow-sm">
                                <div className="flex items-baseline justify-between flex-wrap gap-2">
                                    <h2 className="text-xl font-bold text-blue-400">{milestone.title}</h2>

                                    <div className="flex items-center gap-3">
                                        {milestone.event_date && (
                                            <span className="text-xs font-mono text-slate-400">
                                                {new Date(milestone.event_date).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        )}

                                        {/* Admin Only Action */}
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setActiveMilestoneForVideo(milestone.id)}
                                                    className="px-2.5 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors cursor-pointer border border-slate-600 shadow-sm"
                                                >
                                                    + Add Media
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMilestone(milestone.id)}
                                                    className="px-2.5 py-1 text-xs font-semibold bg-red-950/60 hover:bg-red-900 text-red-300 rounded transition-colors cursor-pointer border border-red-800/80 shadow-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {milestone.description && (
                                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                                        {milestone.description}
                                    </p>
                                )}

                                {milestone.videos && milestone.videos.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Linked Media ({milestone.videos.length})
                                        </h3>
                                        {/* Line 296: Keep grid clean without max-w-md */}
                                        <div className={`grid gap-3 ${milestone.videos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                                            {milestone.videos.map((video) => (
                                                <div
                                                    key={video.id}
                                                    /* Line 301: Apply max-w-md and justify-self-start here so single items stay compact */
                                                    className={`bg-slate-950/80 p-4 rounded-md border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors w-full ${milestone.videos.length === 1 ? 'max-w-md justify-self-start' : ''
                                                        }`}
                                                >
                                                    <div>
                                                        {/* Header: Title & Category & Actions */}
                                                        {/* Header: Title & Dropdowns/Badges */}
                                                        <div className="flex items-start justify-between gap-2 mb-3">
                                                            <div className="space-y-2">
                                                                <h4 className="font-semibold text-sm text-slate-200 line-clamp-2">
                                                                    {video.title || video.youtube_video_id}
                                                                </h4>

                                                                {/* Admin Dropdowns vs Regular Badges */}
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {isAdmin ? (
                                                                        <>
                                                                            {/* Category Dropdown */}
                                                                            <select
                                                                                value={video.category || 'general'}
                                                                                onChange={(e) => handleVideoCategoryChange(video.id, e.target.value)}
                                                                                className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none cursor-pointer"
                                                                                title="Change Category"
                                                                            >
                                                                                <option value="interview">Interview</option>
                                                                                <option value="news">News Broadcast</option>
                                                                                <option value="bodycam">Bodycam / Footage</option>
                                                                                <option value="analysis">Creator Analysis</option>
                                                                                <option value="general">General</option>
                                                                            </select>

                                                                            {/* Status Dropdown */}
                                                                            <select
                                                                                value={video.status || 'pending_review'}
                                                                                onChange={(e) => handleVideoStatusChange(video.id, e.target.value)}
                                                                                className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none cursor-pointer"
                                                                                title="Change Pipeline Status"
                                                                            >
                                                                                <option value="pending_review">Pending Review</option>
                                                                                <option value="analyzing">Analyzing</option>
                                                                                <option value="analyzed">Analyzed</option>
                                                                                <option value="failed">Failed</option>
                                                                            </select>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase tracking-wide">
                                                                                {video.category || 'General'}
                                                                            </span>
                                                                            {video.estimated_event_date && (
                                                                                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                                                                                    Estimated Event Date: {(() => {
                                                                                        const val = video.estimated_event_date;
                                                                                        const dateStr = typeof val === 'object' && val !== null && 'Time' in val
                                                                                            ? (val as { Time: string }).Time
                                                                                            : String(val);
                                                                                        if (!dateStr || dateStr === 'null') return null;
                                                                                        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                                                                                    })()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Admin Action Buttons (Unlink / Delete) */}
                                                            {isAdmin && (
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        onClick={() => handleUnlinkVideo(milestone.id, video.id)}
                                                                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/50 hover:bg-amber-900/60 transition-colors cursor-pointer"
                                                                        title="Unlink from this milestone"
                                                                    >
                                                                        Unlink
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteEntireVideo(video.id)}
                                                                        className="text-[11px] text-red-400 hover:text-red-300 font-medium px-2 py-0.5 rounded bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 transition-colors cursor-pointer"
                                                                        title="Permanently delete video from system"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Native YouTube Iframe Embed */}
                                                        <div className="relative w-full max-w-sm aspect-video mb-3 overflow-hidden rounded bg-black border border-slate-800">
                                                            <iframe
                                                                src={`https://www.youtube-nocookie.com/embed/${video.youtube_video_id}`}
                                                                title={video.title || "YouTube video player"}
                                                                className="absolute top-0 left-0 w-full h-full border-0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                        {/* AI Summary Display */}
                                                        {video.ai_summary && (
                                                            <div className="mt-3 p-2.5 bg-slate-900/90 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed">
                                                                <span className="font-semibold text-blue-400 block mb-1">Summary</span>
                                                                {video.ai_summary}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Add Video */}
            {activeMilestoneForVideo && (
                <AddVideoModal
                    caseId={caseId}
                    token={token}
                    milestoneId={activeMilestoneForVideo}
                    onClose={() => setActiveMilestoneForVideo(null)}
                    onSuccess={() => {
                        setActiveMilestoneForVideo(null);
                        loadTimeline();
                    }}
                />
            )}

            {/* Modal: Add Milestone */}
            {isAddMilestoneOpen && (
                <AddMilestoneModal
                    caseId={caseId}
                    token={token}
                    onClose={() => setIsAddMilestoneOpen(false)}
                    onSuccess={() => {
                        setIsAddMilestoneOpen(false);
                        loadTimeline();
                    }}
                />
            )}
        </div>
    );
};