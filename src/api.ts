// src/api.ts
import type { CaseTimelineResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface CaseItem {
    id: string;
    title: string;
    description?: string;
}

// Centralized request helper keeping your robust error-handling logic
async function request<T>(endpoint: string, options: RequestInit = {}, token?: string | null): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
        let errorMessage = `Server returned status ${response.status}`;
        if (isJson) {
            const errData = await response.json();
            errorMessage = errData.error || errorMessage;
        } else {
            const textData = await response.text();
            errorMessage = textData || errorMessage;
        }
        throw new Error(errorMessage);
    }

    // Handle 204 No Content or empty responses gracefully
    if (response.status === 204) {
        return {} as T;
    }

    if (!isJson) {
        const textData = await response.text();
        throw new Error(`Expected JSON response, but server returned: "${textData}"`);
    }

    return await response.json();
}

// ==========================================
// USERS API
// ==========================================
export async function registerUser(userData: { email: string; password: string }) {
    return request('/api/v1/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function loginUser(credentials: { email: string; password: string }) {
    return request('/api/v1/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

export async function listUsers(token: string) {
    return request('/api/v1/users', { method: 'GET' }, token);
}

export async function getUserByID(userId: string, token: string) {
    return request(`/api/v1/users/${userId}`, { method: 'GET' }, token);
}

export async function deleteUser(userId: string, token: string) {
    return request(`/api/v1/users/${userId}`, { method: 'DELETE' }, token);
}

// ==========================================
// CASES & TIMELINE API
// ==========================================
export async function listCases(): Promise<CaseItem[]> {
    return request<CaseItem[]>('/api/v1/cases', { method: 'GET' });
}

export async function addCase(caseData: { title: string; description?: string }, token: string) {
    return request('/api/v1/cases', {
        method: 'POST',
        body: JSON.stringify(caseData),
    }, token);
}

export async function getCaseByID(caseId: string) {
    return request(`/api/v1/cases/${caseId}`, { method: 'GET' });
}

export async function deleteCase(caseId: string, token: string) {
    return request(`/api/v1/cases/${caseId}`, { method: 'DELETE' }, token);
}

export async function updateCaseTitle(caseId: string, title: string, token: string) {
    return request(`/api/v1/cases/${caseId}/title`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
    }, token);
}

export async function updateCaseDescription(caseId: string, description: string, token: string) {
    return request(`/api/v1/cases/${caseId}/description`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
    }, token);
}

export async function fetchCaseTimeline(caseId: string, token?: string): Promise<CaseTimelineResponse> {
    return request<CaseTimelineResponse>(`/api/v1/cases/${caseId}/timeline`, { method: 'GET' }, token);
}

// ==========================================
// MILESTONES API
// ==========================================
export async function listMilestonesByCase(caseId: string) {
    return request(`/api/v1/cases/${caseId}/milestones`, { method: 'GET' });
}

export async function addMilestone(caseId: string, milestoneData: any, token: string) {
    return request(`/api/v1/cases/${caseId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(milestoneData),
    }, token);
}

export async function getMilestoneByID(milestoneId: string, token: string) {
    return request(`/api/v1/milestones/${milestoneId}`, { method: 'GET' }, token);
}

export async function deleteMilestone(milestoneId: string, token: string) {
    return request(`/api/v1/milestones/${milestoneId}`, { method: 'DELETE' }, token);
}

export async function updateMilestoneTitle(milestoneId: string, title: string, token: string) {
    return request(`/api/v1/milestones/${milestoneId}/title`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
    }, token);
}

export async function updateMilestoneDescription(milestoneId: string, description: string, token: string) {
    return request(`/api/v1/milestones/${milestoneId}/description`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
    }, token);
}

export async function updateMilestoneEventDate(milestoneId: string, eventDate: string, token: string) {
    return request(`/api/v1/milestones/${milestoneId}/event_date`, {
        method: 'PATCH',
        body: JSON.stringify({ event_date: eventDate }),
    }, token);
}

// ==========================================
// VIDEOS API
// ==========================================
export async function listVideos(token: string) {
    return request('/api/v1/videos', { method: 'GET' }, token);
}

export async function addVideo(videoData: any, token: string) {
    return request('/api/v1/videos', {
        method: 'POST',
        body: JSON.stringify(videoData),
    }, token);
}

export async function listUnlinkedVideos(token: string) {
    return request('/api/v1/videos/unlinked', { method: 'GET' }, token);
}

export async function listVideosByStatus(status: string, token: string) {
    return request(`/api/v1/videos/status?status=${encodeURIComponent(status)}`, { method: 'GET' }, token);
}

export async function listVideosBySummarySource(source: string, token: string) {
    return request(`/api/v1/videos/summary_source?source=${encodeURIComponent(source)}`, { method: 'GET' }, token);
}

export async function listVideosNotEnriched(token: string) {
    return request('/api/v1/videos/not_enriched', { method: 'GET' }, token);
}

export async function listVideosMissingTranscripts(token: string) {
    return request('/api/v1/videos/missing_transcripts', { method: 'GET' }, token);
}

export async function getVideoByID(videoId: string, token: string) {
    return request(`/api/v1/videos/${videoId}`, { method: 'GET' }, token);
}

export async function deleteVideo(videoId: string, token: string) {
    return request(`/api/v1/videos/${videoId}`, { method: 'DELETE' }, token);
}

export async function enrichVideo(videoId: string, token: string) {
    return request(`/api/v1/videos/${videoId}/enrich`, { method: 'POST' }, token);
}

export async function updateVideoCategory(videoId: string, category: string, token: string) {
    return request(`/api/v1/videos/${videoId}/category`, {
        method: 'PATCH',
        body: JSON.stringify({ category }),
    }, token);
}

export async function updateVideoStatus(videoId: string, status: string, token: string) {
    return request(`/api/v1/videos/${videoId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }, token);
}

export async function updateVideoTranscript(videoId: string, transcript: string, token: string) {
    return request(`/api/v1/videos/${videoId}/transcript`, {
        method: 'PATCH',
        body: JSON.stringify({ transcript }),
    }, token);
}

export async function updateVideoEstimatedEventDate(videoId: string, eventDate: string, token: string) {
    return request(`/api/v1/videos/${videoId}/event_date`, {
        method: 'PATCH',
        body: JSON.stringify({ event_date: eventDate }),
    }, token);
}

// ==========================================
// MILESTONE-VIDEO JOIN API
// ==========================================
export async function listVideosByMilestone(milestoneId: string) {
    return request(`/api/v1/milestones/${milestoneId}/videos`, { method: 'GET' });
}

export async function linkVideoToMilestone(milestoneId: string, videoId: string, token: string) {
    return request(`/api/v1/milestones/${milestoneId}/videos/${videoId}`, { method: 'PUT' }, token);
}

export async function unlinkVideoFromMilestone(milestoneId: string, videoId: string, token: string) {
    return request(`/api/v1/milestones/${milestoneId}/videos/${videoId}`, { method: 'DELETE' }, token);
}

// ==========================================
// JWT HELPERS
// ==========================================
export interface JwtPayload {
    sub?: string;
    role?: string;
    exp?: number;
    [key: string]: unknown;
}

export function parseJwt(token: string | null): JwtPayload | null {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}