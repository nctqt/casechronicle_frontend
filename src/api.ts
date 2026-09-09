// src/api.ts
import type { CaseTimelineResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function fetchCaseTimeline(caseId: string, token: string): Promise<CaseTimelineResponse> {
    const response = await fetch(`/api/v1/cases/${caseId}/timeline`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
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

    if (!isJson) {
        const textData = await response.text();
        throw new Error(`Expected JSON response, but server returned: "${textData}"`);
    }

    return await response.json();
}