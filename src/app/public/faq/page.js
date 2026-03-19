import App from "@/core/App.js";
import api from "@/services/api.js";
import "@/components/ui/Accordion.js";
import "@/components/ui/ContentDisplay.js";

class PublicFaqPage extends App {
  constructor() {
    super();
    this.page = null;
    this.loading = true;
    this.error = "";
    this.faqs = [];
    this.heroImages = [];
    this.heroIndex = 0;
    this.heroTimer = null;
    this._lastRendered = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadData();
  }

  disconnectedCallback() {
    if (this.heroTimer) clearInterval(this.heroTimer);
  }

  async loadData() {
    this.loading = true;
    this.updateView();
    try {
      const [pageRes, faqRes] = await Promise.all([
        api.get("/pages/slug/faq").catch(() => null),
        api.get("/faqs/public").catch(() => null),
      ]);
      this.page = pageRes?.data?.data || null;
      const banners = this.normalizeImageList(this.page?.banner_image);
      const gallery = this.normalizeImageList(this.page?.images);
      this.heroImages = gallery.length ? (banners.length ? [...banners, ...gallery] : gallery) : banners;
      this.heroIndex = 0;
      this.startHeroRotation();
      this.faqs = Array.isArray(faqRes?.data?.data) ? faqRes.data.data : [];
    } catch (e) {
      this.error = "Unable to load FAQ page.";
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
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.heroImages.length <= 1) return;
    this.heroTimer = setInterval(() => {
      this.heroIndex = (this.heroIndex + 1) % this.heroImages.length;
      this.updateView();
    }, 5000);
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
    const title = this.page?.title || "Frequently Asked Questions";
    const subtitle = this.page?.subtitle || "Answers to the questions we hear the most.";
    if (!this.heroImages.length) {
      return `
        <section class="bg-slate-900 rounded-[2.5rem] p-10 sm:p-12 lg:p-16 text-center text-white mb-12 shadow-2xl overflow-hidden relative">
          <div class="relative z-10 max-w-3xl mx-auto">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 tracking-tighter leading-tight">${title}</h1>
            <p class="text-slate-200/80 text-base sm:text-lg mb-6 font-medium">${subtitle}</p>
          </div>
        </section>
      `;
    }

    const slides = this.heroImages
      .map((img, index) => {
        const url = this.getImageUrl(img);
        const active = index === this.heroIndex;
        return `<img src="${url}" alt="${title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${active ? "opacity-100" : "opacity-0"}">`;
      })
      .join("");

    return `
      <section class="relative overflow-hidden rounded-[2.5rem] mb-12 border border-slate-200 shadow-2xl group">
        <div class="relative h-[360px] sm:h-[420px] lg:h-[480px]">
          ${slides}
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/30"></div>
          <div class="absolute inset-0 z-10 flex items-end sm:items-center">
            <div class="w-full px-6 sm:px-12 lg:px-16 py-10 sm:py-0 text-left text-white">
              <div class="max-w-2xl">
                <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">${title}</h1>
                <p class="text-white/85 text-sm sm:text-lg mb-6">${subtitle}</p>
              </div>
            </div>
          </div>
          <div class="absolute inset-y-0 left-4 sm:left-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all" onclick="this.closest('app-public-faq-page').prevHero()" aria-label="Previous slide">
              <i class="fas fa-chevron-left text-sm"></i>
            </button>
          </div>
          <div class="absolute inset-y-0 right-4 sm:right-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all" onclick="this.closest('app-public-faq-page').nextHero()" aria-label="Next slide">
              <i class="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
        </div>
      </section>
    `;
  }

  render() {
    if (this.loading) {
      return `
        <section class="max-w-6xl mx-auto px-6 py-16">
          <div class="h-10 w-56 bg-slate-100 rounded-2xl animate-pulse mb-6"></div>
          <div class="space-y-3">
            ${Array(6).fill('<div class="h-4 bg-slate-100 rounded-full animate-pulse"></div>').join("")}
          </div>
        </section>
      `;
    }

    if (this.error) {
      return `
        <section class="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 class="text-3xl font-black text-slate-900 mb-3">FAQ</h1>
          <p class="text-slate-500 mb-6">${this.error}</p>
          <a href="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">Back to home</a>
        </section>
      `;
    }

    return `
      <section class="max-w-6xl mx-auto px-6 py-12">
        ${this.renderHero()}
        ${this.page?.content ? `
          <div class="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm mb-12">
            <content-display content="${(this.page.content || "").replace(/"/g, "&quot;")}"></content-display>
          </div>
        ` : ""}
        <div class="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm">
          <ui-accordion>
            ${this.faqs.map((f) => `
              <ui-accordion-item title="${(f.question || "").replace(/"/g, "&quot;")}">
                <div class="text-sm text-slate-600 leading-relaxed">${f.answer || ""}</div>
              </ui-accordion-item>
            `).join("")}
          </ui-accordion>
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
}

customElements.define("app-public-faq-page", PublicFaqPage);
export default PublicFaqPage;
