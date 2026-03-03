import App from "@/core/App.js";

class PagesPage extends App {
  render() {
    return `
      <div class="p-10 pb-20">
        <header class="flex items-center justify-between mb-12">
          <div>
            <h1 class="text-4xl font-black text-slate-900 tracking-tighter mb-2 font-brand">Cloud Pages</h1>
            <p class="text-slate-500 font-medium">Manage static content and custom pages.</p>
          </div>
          <ui-button color="primary" class="h-12 px-8 rounded-2xl font-bold">
            <i class="fas fa-plus mr-2"></i> New Page
          </ui-button>
        </header>

        <div class="bg-white border border-slate-100 rounded-[2rem] p-12 text-center shadow-sm">
          <div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
            <i class="fas fa-pager text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">No Custom Pages</h3>
          <p class="text-slate-500 max-w-xs mx-auto mb-8">Create terms of service, about us, or other custom content.</p>
        </div>
      </div>
    `;
  }
}

customElements.define("app-pages-page", PagesPage);
export default PagesPage;
