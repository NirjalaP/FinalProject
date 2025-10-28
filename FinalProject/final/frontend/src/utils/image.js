export function resolveImageUrl(url) {
  if (!url) return url;
  // If absolute URL (http/https), return as-is
  if (/^https?:\/\//i.test(url)) return url;

  // If root-relative (starts with /), and we're in dev, prefix with API origin
  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const apiOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${apiOrigin}${url}`;
}
