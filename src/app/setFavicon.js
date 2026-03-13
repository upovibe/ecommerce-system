import api from "@/services/api.js";

export async function setDynamicFavicon() {
  try {
    const response = await api.get("/settings/key/application_favicon");
    if (response.data.success && response.data.data.setting_value) {
      const faviconUrl = `/api/${response.data.data.setting_value}`;
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  } catch (error) {
    // fallback: keep default favicon
  }
}

// Auto-run if imported
setDynamicFavicon();

export default {};
