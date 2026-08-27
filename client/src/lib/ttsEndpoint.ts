export function resolveTtsEndpoint(apiBaseUrl?: string) {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "");
  return base ? `${base}/api/trpc` : "/api/trpc";
}

export function usesRemoteTts(apiBaseUrl?: string) {
  return Boolean(apiBaseUrl?.trim());
}
