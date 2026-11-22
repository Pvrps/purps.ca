/** Answers whenever the app is up, for whatever is keeping an eye on it. */
export const GET = () => new Response('ok', { headers: { 'Cache-Control': 'no-store' } });
