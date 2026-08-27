const defaultGitHubPagesOrigin = "https://baekjunjoo.github.io";

export function publicApiCorsHeaders(origin?: string) {
  const allowedOrigin = process.env.SENSORY_PUBLIC_API_ALLOWED_ORIGIN ?? defaultGitHubPagesOrigin;
  if (origin !== allowedOrigin) return {};
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}
