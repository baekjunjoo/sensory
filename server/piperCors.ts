const defaultGitHubPagesOrigin = "https://baekjunjoo.github.io";

export function piperCorsHeaders(origin?: string) {
  const allowedOrigin = process.env.PIPER_ALLOWED_ORIGIN ?? defaultGitHubPagesOrigin;
  if (origin !== allowedOrigin) return {};
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}
