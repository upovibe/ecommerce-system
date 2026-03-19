import App from "@/core/App.js";
import "@/components/ui/ContentDisplay.js";
import api from "@/services/api.js";

class PublicContentPage extends App {
  constructor() {
    super();
    this.page = null;
    this.loading = true;
    this.error = "";
    this.heroImages = [];
    this.heroIndex = 0;
    this.heroTimer = null;
    this.heroRotationMs = 5000;
    this._lastRendered = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadPage();
  }

  disconnectedCallback() {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }

  async loadPage() {
    try {
      const params = this.routeParams || this.get("routeParams") || {};
      let slug = params.slug;
      if (!slug) {
        const parts = window.location.pathname.split("/").filter(Boolean);
        slug = parts[0] === "public" ? parts[1] : parts[0];
      }
      if (!slug) {
        this.error = "Page not found";
        this.loading = false;
        this.updateView();
        return;
      }
      const res = await api.get(`/pages/slug/${encodeURIComponent(slug)}`);
      this.page = res?.data?.data || null;
      if (!this.page) this.error = "Page not found";
      const banners = this.normalizeImageList(this.page?.banner_image);
      const gallery = this.normalizeImageList(this.page?.images);
      this.heroImages = gallery.length ? (banners.length ? [...banners, ...gallery] : gallery) : banners;
      this.heroIndex = 0;
      this.startHeroRotation();
    } catch (e) {
      this.page = null;
      this.error = e?.response?.data?.message || "Unable to load this page.";
      this.heroImages = [];
      this.heroIndex = 0;
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  normalizeImageList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (_) {
          return [];
        }
      }
      return [trimmed];
    }
    return [];
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/${String(path).replace(/^\/+/, "")}`;
  }

  startHeroRotation() {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
    if (this.heroImages.length <= 1) return;
    this.heroTimer = setInterval(() => {
      this.heroIndex = (this.heroIndex + 1) % this.heroImages.length;
      this.updateView();
    }, this.heroRotationMs);
  }

  prevHero() {
    if (!this.heroImages.length) return;
    this.heroIndex = (this.heroIndex - 1 + this.heroImages.length) % this.heroImages.length;
    this.updateView();
  }

  nextHero() {
    if (!this.heroImages.length) return;
    this.heroIndex = (this.heroIndex + 1) % this.heroImages.length;
    this.updateView();
  }

  renderHero() {
    if (!this.page) return "";
    const title = this.page?.title || "";
    const subtitle = this.page?.subtitle || "";
    if (!this.heroImages.length) {
      return `
        <section class="bg-indigo-600 rounded-[2.5rem] p-10 sm:p-12 lg:p-16 text-center text-white mb-12 shadow-2xl overflow-hidden relative border border-indigo-500/50">
          <div class="relative z-10 max-w-3xl mx-auto">
            ${title ? `<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 tracking-tighter leading-tight">${title}</h1>` : ""}
            ${subtitle ? `<p class="text-indigo-100/80 text-base sm:text-lg mb-6 font-medium">${subtitle}</p>` : ""}
          </div>
          <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <i class="fas fa-scroll text-[16rem] absolute -top-16 -left-10 rotate-6"></i>
            <i class="fas fa-file-alt text-[12rem] absolute -bottom-20 -right-6 -rotate-6"></i>
          </div>
        </section>
      `;
    }

    const slides = this.heroImages
      .map((img, index) => {
        const url = this.getImageUrl(img);
        const active = index === this.heroIndex;
        return `
          <img src="${url}" alt="${title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${active ? "opacity-100" : "opacity-0"}">
        `;
      })
      .join("");

    const dots =
      this.heroImages.length > 1
        ? `
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            ${this.heroImages
              .map((_, index) => `<span class="w-2 h-2 rounded-full ${index === this.heroIndex ? "bg-white" : "bg-white/40"}"></span>`)
              .join("")}
          </div>
        `
        : "";

    return `
      <section class="relative overflow-hidden rounded-[2.5rem] mb-12 border border-slate-200 shadow-2xl group">
        <div class="relative h-[360px] sm:h-[420px] lg:h-[480px]">
          ${slides}
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/30"></div>
          <div class="absolute inset-0 z-10 flex items-end sm:items-center">
            <div class="w-full px-6 sm:px-12 lg:px-16 py-10 sm:py-0 text-left text-white">
              <div class="max-w-2xl">
                ${title ? `<h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">${title}</h1>` : ""}
                ${subtitle ? `<p class="text-white/85 text-sm sm:text-lg mb-6">${subtitle}</p>` : ""}
              </div>
            </div>
          </div>
          <div class="absolute inset-y-0 left-4 sm:left-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all" onclick="this.closest('app-public-content-page').prevHero()" aria-label="Previous slide">
              <i class="fas fa-chevron-left text-sm"></i>
            </button>
          </div>
          <div class="absolute inset-y-0 right-4 sm:right-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all" onclick="this.closest('app-public-content-page').nextHero()" aria-label="Next slide">
              <i class="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
          ${dots}
        </div>
      </section>
    `;
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
      <section class="max-w-6xl mx-auto px-6 py-12">
        ${this.renderHero()}
        <div class="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.35)]">
          <div class="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-li:text-base">
            <content-display content="${(this.page.content || "").replace(/"/g, "&quot;")}"></content-display>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define("app-public-content-page", PublicContentPage);
export default PublicContentPage;
