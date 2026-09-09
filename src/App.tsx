import { CaseTimeline } from './components/CaseTimeline';

export default function App() {
  // Replace these with a real UUID and JWT token from your Go backend tests/login response
  const sampleCaseId = "c8bbf1a4-ecb6-4e8a-869a-de8e02489a86";
  const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0Y190aW1lY2Fwc3VsZSIsInN1YiI6IjhkY2EwMjYxLWVjYzItNGUyOS1hYTljLWI3ZjllNGQ4ODdkOSIsImV4cCI6MTc4OTAxOTU0OSwiaWF0IjoxNzg4OTMzMTQ5fQ.fGbiOhq8-eo8Vzl6UNYsfKZcRO8tn96t1fkgSz_fYKc"

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <CaseTimeline caseId={sampleCaseId} token={jwtToken} />
    </main>
  );
}