import App from "@/core/App.js";
import "@/components/ui/ContentDisplay.js";
import api from "@/services/api.js";

class PublicContentPage extends App {
  constructor() {
    super();
    this.page = null;
    this.loading = true;
    this.error = "";
    this._lastRendered = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadPage();
  }

  async loadPage() {
    try {
      const params = this.routeParams || this.get("routeParams") || {};
      const slug = params.slug;
      if (!slug) {
        this.error = "Page not found";
        this.loading = false;
        this.updateView();
        return;
      }
      const res = await api.get(`/pages/slug/${encodeURIComponent(slug)}`);
      this.page = res?.data?.data || null;
      if (!this.page) this.error = "Page not found";
    } catch (e) {
      this.page = null;
      this.error = e?.response?.data?.message || "Unable to load this page.";
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  render() {
    if (this.loading) {
      return `
        <section class="max-w-5xl mx-auto px-6 py-16">
          <div class="h-10 w-56 bg-slate-100 rounded-2xl animate-pulse mb-6"></div>
          <div class="space-y-3">
            ${Array(6).fill('<div class="h-4 bg-slate-100 rounded-full animate-pulse"></div>').join("")}
          </div>
        </section>
      `;
    }

    if (this.error || !this.page) {
      return `
        <section class="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 class="text-3xl font-black text-slate-900 mb-3">Page not found</h1>
          <p class="text-slate-500 mb-6">${this.error || "The requested page could not be found."}</p>
          <a href="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">
            Back to home
          </a>
        </section>
      `;
    }

    return `
      <section class="max-w-5xl mx-auto px-6 py-14">
        <header class="mb-10">
          <p class="text-xs font-semibold text-indigo-500 mb-2">Information</p>
          <h1 class="text-4xl font-black text-slate-900 mb-3">${this.page.title}</h1>
          ${this.page.subtitle ? `<p class="text-slate-500 text-base font-medium">${this.page.subtitle}</p>` : ""}
        </header>
        <div class="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm">
          <ui-content-display content="${(this.page.content || "").replace(/"/g, "&quot;")}"></ui-content-display>
        </div>
      </section>
    `;
  }
}

customElements.define("app-public-content-page", PublicContentPage);
export default PublicContentPage;
