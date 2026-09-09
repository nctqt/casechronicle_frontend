export interface User {
    id: string;
    email: string;
    created_at: string;
}

export type VideoStatus = 'pending_review' | 'analyzing' | 'analyzed' | 'failed';

export interface Video {
    id: string;
    youtube_video_id: string;
    title: string;
    channel_name: string;
    status: VideoStatus;
    summary?: string;
    category?: string;
    estimated_event_date?: string;
    created_at: string;
}

export interface Case {
    id: string;
    title: string;
    description?: string;
    created_at: string;
}

export interface Milestone {
    id: string;
    case_id: string;
    title: string;
    description?: string;
    event_date?: string;
    created_at: string;
}

export interface MilestoneWithMedia extends Milestone {
    videos: Video[];
}

export interface CaseTimelineResponse {
    case: Case;
    milestones: MilestoneWithMedia[];
}