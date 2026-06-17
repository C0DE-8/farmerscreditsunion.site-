const API_ORIGIN = "http://localhost:5000";

export function resolveAsset(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}
