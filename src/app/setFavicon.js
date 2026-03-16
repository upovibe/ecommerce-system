import api from "@/services/api.js";

function resolveAsset(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  )
    return path;
  const baseUrl = window.location.origin;
  if (path.startsWith("/api/")) return baseUrl + path;
  if (path.startsWith("/")) return baseUrl + path;
  if (path.startsWith("uploads/")) return `${baseUrl}/api/${path}`;
  return `${baseUrl}/api/${path}`;
}

export async function setDynamicFavicon() {
  try {
    const response = await api.get("/settings/key/application_favicon");
    if (response.data.success && response.data.data.setting_value) {
      const faviconUrl = resolveAsset(response.data.data.setting_value);
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
      return;
    }
  } catch (error) {
    // fallback below
  }
  // fallback to bundled favicon
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = "/favicon.ico";
}

// Auto-run if imported
setDynamicFavicon();

export default {};
