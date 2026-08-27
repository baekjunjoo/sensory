const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL?.trim().replace(/\/+$/, "");

export function publicAsset(path: string) {
  return assetBaseUrl ? `${assetBaseUrl}${path}` : path;
}
