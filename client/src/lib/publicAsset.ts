const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL?.trim().replace(/\/+$/, "");

export function publicAsset(path: string, releaseAsset?: string) {
  return assetBaseUrl && releaseAsset ? `${assetBaseUrl}/${releaseAsset}` : path;
}
