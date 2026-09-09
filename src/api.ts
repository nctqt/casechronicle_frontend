// src/api.ts
import type { CaseTimelineResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function fetchCaseTimeline(caseId: string, token: string): Promise<CaseTimelineResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cases/${caseId}/timeline`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized access. Please check your token.');
        }
        if (response.status === 404) {
            throw new Error(`Case timeline for ID "${caseId}" was not found.`);
        }
        throw new Error(`API error (${response.status}): ${response.statusText}`);
    }

    return response.json();
}