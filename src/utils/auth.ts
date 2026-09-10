// src/utils/auth.ts
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