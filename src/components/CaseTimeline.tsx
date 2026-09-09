// src/components/CaseTimeline.tsx
import React, { useState, useEffect } from 'react';
import type { CaseTimelineResponse } from '../types';
import { fetchCaseTimeline } from '../api';

interface CaseTimelineProps {
    caseId: string;
    token: string;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ caseId, token }) => {
    const [timeline, setTimeline] = useState<CaseTimelineResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!caseId || !token) {
            setLoading(false);
            setError('Missing case ID or authentication token.');
            return;
        }

        let isMounted = true;

        const loadTimeline = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchCaseTimeline(caseId, token);
                if (isMounted) setTimeline(data);
            } catch (err: unknown) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load timeline.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadTimeline();

        return () => {
            isMounted = false;
        };
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
            <div className="border-b border-slate-800 pb-4 mb-8">
                <h1 className="text-3xl font-extrabold text-slate-50">{timeline.case.title}</h1>
                {timeline.case.description && (
                    <p className="text-slate-400 mt-2 text-base leading-relaxed">
                        {timeline.case.description}
                    </p>
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
                                    {milestone.event_date && (
                                        <span className="text-xs font-mono text-slate-400">
                                            {new Date(milestone.event_date).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    )}
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {milestone.videos.map((video) => (
                                                <div
                                                    key={video.id}
                                                    className="bg-slate-950/80 p-4 rounded-md border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-semibold text-sm text-slate-200 line-clamp-2">
                                                                {video.title || video.youtube_video_id}
                                                            </h4>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Channel: {video.channel_name || 'Unknown'}
                                                        </p>
                                                        {video.summary && (
                                                            <p className="text-xs text-slate-300 mt-2 line-clamp-3 bg-slate-900/60 p-2 rounded border border-slate-800">
                                                                {video.summary}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                                                        {renderStatusBadge(video.status)}
                                                        {video.category && (
                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                {video.category}
                                                            </span>
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
        </div>
    );
};