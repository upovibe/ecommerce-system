import App from "@/core/App.js";

class SettingsPage extends App {
  render() {
    return `
      <div class="p-10 pb-20">
        <header class="mb-12">
          <h1 class="text-4xl font-black text-slate-900 tracking-tighter mb-2 font-brand">Preferences</h1>
          <p class="text-slate-500 font-medium">Configure global system and store settings.</p>
        </header>

        <div class="bg-white border border-slate-100 rounded-[2rem] p-12 text-center shadow-sm">
          <div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
            <i class="fas fa-sliders-h text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">Configuration Hub</h3>
          <p class="text-slate-500 max-w-xs mx-auto mb-8">System settings and design tokens can be adjusted here.</p>
        </div>
      </div>
    `;
  }
}

customElements.define("app-settings-page", SettingsPage);
export default SettingsPage;
