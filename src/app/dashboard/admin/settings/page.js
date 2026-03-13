import App from "@/core/App.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import "@/components/ui/FileUpload.js";
import "@/components/ui/Button.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class SettingsPage extends App {
  constructor() {
    super();
    this.settings = [];
    this.loading = true;
    this._lastRendered = "";
    this._isInitialized = false;
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;
    await this.loadSettings();
  }

  async loadSettings() {
    this.loading = true;
    this.updateView();

    try {
      const res = await api.get("/settings");
      const data = res?.data?.data;
      this.settings = Array.isArray(data) ? data : [];
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to load settings",
        variant: "error",
      });
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  groupSettings() {
    const groups = {};
    (this.settings || []).forEach((s) => {
      const key = s.category || "general";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    const order = [
      "general",
      "localization",
      "contact",
      "social",
      "theme",
      "location",
      "other",
    ];
    const ordered = {};
    order.forEach((k) => {
      if (groups[k]) ordered[k] = groups[k];
    });
    Object.keys(groups).forEach((k) => {
      if (!ordered[k]) ordered[k] = groups[k];
    });
    return ordered;
  }

  getImageUrl(path) {
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
    return `${baseUrl}/api/${path.replace(/^\//, "")}`;
  }

  getSettingDisplayValue(setting) {
    if (!setting) return "";
    if (setting.setting_type === "array") {
      if (
        Array.isArray(setting.setting_value) ||
        typeof setting.setting_value === "object"
      ) {
        return JSON.stringify(setting.setting_value, null, 2);
      }
      return setting.setting_value || "";
    }
    return setting.setting_value ?? "";
  }

  getCategoryTitle(cat) {
    const map = {
      general: "General",
      localization: "Localization",
      contact: "Contact",
      social: "Social",
      theme: "Theme",
      location: "Location",
    };
    return map[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  async saveSetting(id) {
    const setting = this.settings.find((s) => String(s.id) === String(id));
    if (!setting) return;
    const card = this.querySelector(`[data-setting-id="${id}"]`);
    if (!card) return;

    const isActiveSwitch = card.querySelector("ui-switch");
    const is_active = isActiveSwitch?.checked ? 1 : 0;

    try {
      if (setting.setting_type === "image" || setting.setting_type === "file") {
        const uploader = card.querySelector("ui-file-upload");
        const files = uploader?.getFiles?.() || [];
        const newFile = files.find((f) => !f.isExisting);

        if (newFile) {
          const formData = new FormData();
          formData.append("setting_value", newFile);
          formData.append("category", setting.category || "general");
          formData.append("is_active", String(is_active));
          await api.put(`/settings/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.put(`/settings/${id}`, {
            setting_value: setting.setting_value,
            is_active,
          });
        }
      } else if (setting.setting_type === "array") {
        const input = card.querySelector("ui-textarea");
        const raw = input?.getValue ? input.getValue() : input?.value;
        let parsed;
        try {
          parsed = raw ? JSON.parse(raw) : [];
        } catch (e) {
          window.Toast?.show?.({
            title: "Invalid JSON",
            message: "Array settings must be valid JSON",
            variant: "error",
          });
          return;
        }
        await api.put(`/settings/${id}`, {
          setting_value: JSON.stringify(parsed),
          is_active,
        });
      } else if (setting.setting_type === "boolean") {
        const toggle = card.querySelector("ui-switch");
        const isEnabled = toggle?.checked ? "1" : "0";
        await api.put(`/settings/${id}`, {
          setting_value: isEnabled,
          is_active,
        });
      } else {
        const input = card.querySelector("ui-input");
        const value = input?.value ?? "";
        await api.put(`/settings/${id}`, {
          setting_value: value,
          is_active,
        });
      }

      window.Toast?.show?.({
        title: "Saved",
        message: "Setting updated successfully",
        variant: "success",
      });

      await this.loadSettings();
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: e.response?.data?.message || "Failed to update setting",
        variant: "error",
      });
    }
  }

  renderSettingCard(setting) {
    const value = this.getSettingDisplayValue(setting);
    const isImage =
      setting.setting_type === "image" || setting.setting_type === "file";
    const isArray = setting.setting_type === "array";
    const isColor = setting.setting_type === "color";
    const isBoolean = setting.setting_type === "boolean";

    return `
      <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm" data-setting-id="${setting.id}">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 class="text-sm font-bold text-slate-900">${setting.setting_key.replace(/_/g, " ")}</h4>
            <p class="text-[11px] text-slate-500 mt-1">${setting.description || ""}</p>
          </div>
          <ui-switch ${setting.is_active ? "checked" : ""}>
            <span slot="label" class="text-xs">Active</span>
          </ui-switch>
        </div>

        <div class="space-y-2">
          ${
            isBoolean
              ? `
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <ui-switch ${String(value) === "1" || String(value).toLowerCase() === "true" ? "checked" : ""}>
                <span slot="label">Enabled</span>
              </ui-switch>
              <span>Toggle to enable or disable</span>
            </div>
          `
              : isImage
                ? `
            <ui-file-upload accept="image/*" max-size="5242880" max-files="1" ${setting.setting_value ? `value="${this.getImageUrl(setting.setting_value)}"` : ""}></ui-file-upload>
          `
                : isArray
                  ? `
            <ui-textarea rows="3" placeholder="Enter JSON array..." class="w-full" value="${String(value).replace(/"/g, "&quot;")}"></ui-textarea>
          `
                  : `
            <ui-input type="${isColor ? "color" : "text"}" value="${String(value).replace(/"/g, "&quot;")}" class="w-full"></ui-input>
          `
          }
        </div>

        <div class="mt-3 flex justify-end">
          <button class="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition" onclick="this.closest('app-settings-page').saveSetting(${setting.id})">
            Save
          </button>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return `
        <div class="p-4 sm:p-6 lg:p-8 pb-16">
          <div class="mb-6">
            <div class="h-8 w-48 bg-slate-100 rounded-xl animate-pulse"></div>
            <div class="h-4 w-64 bg-slate-100 rounded-lg mt-3 animate-pulse"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            ${Array(6).fill(`<div class="h-32 bg-slate-100 rounded-xl animate-pulse"></div>`).join("")}
          </div>
        </div>
      `;
    }

    const groups = this.groupSettings();

    return `
      <div class="pb-16">
        <header class="mb-6">
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-1 font-brand">Preferences</h1>
          <p class="text-slate-500 text-sm sm:text-base font-medium">Configure global system and store settings.</p>
        </header>

        <div class="space-y-6">
          ${
            Object.keys(groups).length === 0
              ? `
            <div class="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm">
              <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                <i class="fas fa-sliders-h text-2xl"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 mb-2">No Settings Found</h3>
              <p class="text-slate-500 max-w-xs mx-auto text-sm">Add settings via the API or seeder to manage preferences here.</p>
            </div>
          `
              : Object.entries(groups)
                  .map(
                    ([cat, items]) => `
            <section>
              <div class="flex items-center gap-3 mb-3">
                <div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">
                  <i class="fas fa-sliders-h"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">${this.getCategoryTitle(cat)}</h2>
                  <p class="text-[11px] text-slate-500">${items.length} setting${items.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                ${items.map((s) => this.renderSettingCard(s)).join("")}
              </div>
            </section>
          `,
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  }
}

customElements.define("app-settings-page", SettingsPage);
export default SettingsPage;
