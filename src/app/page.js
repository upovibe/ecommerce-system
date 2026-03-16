import App from "@/core/App.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/ContentDisplay.js";
import api from "@/services/api.js";

// Root page - public landing
export default class RootPage extends App {
  constructor() {
    super();
    this.products = [];
    this.loading = true;
    this.categories = [];
    this.categoriesLoading = true;
    this.currencyCode = "USD";
    this.pageData = null;
    this.pageLoading = true;
    this.heroImages = [];
    this.heroIndex = 0;
    this.heroTimer = null;
    this.heroRotationMs = 5000;
    this._lastRendered = "";
    this._isInitialized = false;
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
    this.attachEvents();
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;
    await Promise.all([
      this.loadPage(),
      this.loadProducts(),
      this.loadCategories(),
      this.loadCurrency(),
    ]);
  }

  attachEvents() {
    this.initCarousel("landing-categories");
  }

  initCarousel(key) {
    const track = this.querySelector(`[data-carousel-track="${key}"]`);
    const prev = this.querySelector(`[data-carousel-prev="${key}"]`);
    const next = this.querySelector(`[data-carousel-next="${key}"]`);
    const dots = this.querySelector(`[data-carousel-dots="${key}"]`);
    if (!track || !dots) return;

    const items = Array.from(track.children);
    if (!items.length) return;

    const getPageCount = () => {
      const first = items[0];
      if (!first) return 1;
      const itemWidth = first.getBoundingClientRect().width;
      const gap = 20;
      const viewport = track.getBoundingClientRect().width;
      const perView = Math.max(1, Math.floor((viewport + gap) / (itemWidth + gap)));
      return Math.max(1, Math.ceil(items.length / perView));
    };

    const buildDots = (pages, active) => {
      dots.innerHTML = Array.from({ length: pages })
        .map(
          (_, i) =>
            `<span class="w-2 h-2 rounded-full ${i === active ? "bg-slate-900" : "bg-slate-300"}"></span>`,
        )
        .join("");
      dots.style.display = "flex";
    };

    const updateDots = () => {
      const pages = getPageCount();
      const pageWidth = track.getBoundingClientRect().width;
      const active = Math.round(track.scrollLeft / pageWidth);
      buildDots(pages, Math.min(active, pages - 1));
    };

    if (prev) {
      prev.onclick = () => {
        track.scrollBy({ left: -track.getBoundingClientRect().width, behavior: "smooth" });
      };
    }
    if (next) {
      next.onclick = () => {
        track.scrollBy({ left: track.getBoundingClientRect().width, behavior: "smooth" });
      };
    }
    track.addEventListener("scroll", () => {
      window.requestAnimationFrame(updateDots);
    });
    window.addEventListener("resize", () => updateDots());
    updateDots();
  }

  disconnectedCallback() {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
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
        } catch {
          return [];
        }
      }
      return [value];
    }
    return [];
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

  nextHero() {
    if (!this.heroImages.length) return;
    this.heroIndex = (this.heroIndex + 1) % this.heroImages.length;
    this.startHeroRotation();
    this.updateView();
  }

  prevHero() {
    if (!this.heroImages.length) return;
    this.heroIndex =
      (this.heroIndex - 1 + this.heroImages.length) % this.heroImages.length;
    this.startHeroRotation();
    this.updateView();
  }

  async loadPage() {
    this.pageLoading = true;
    this.updateView();

    try {
      const res = await api.get("/pages/slug/home");
      const data = res?.data?.data || null;
      this.pageData = data;

      const bannerImages = this.normalizeImageList(data?.banner_image);
      const galleryImages = this.normalizeImageList(data?.images);

      if (galleryImages.length > 0) {
        this.heroImages =
          bannerImages.length > 0
            ? [...bannerImages, ...galleryImages]
            : galleryImages;
      } else {
        this.heroImages = bannerImages;
      }
      this.heroIndex = 0;
      this.startHeroRotation();
    } catch (e) {
      console.error("Failed to load home page", e);
      this.pageData = null;
      this.heroImages = [];
      this.heroIndex = 0;
    } finally {
      this.pageLoading = false;
      this.updateView();
    }
  }

  async loadProducts() {
    this.loading = true;
    this.updateView();

    try {
      const res = await api.get("/products/public");
      const data = res?.data?.data;
      this.products = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Failed to load products", e);
      this.products = [];
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  async loadCategories() {
    this.categoriesLoading = true;
    this.updateView();
    try {
      const res = await api.get("/categories");
      const data = res?.data?.data;
      this.categories = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Failed to load categories", e);
      this.categories = [];
    } finally {
      this.categoriesLoading = false;
      this.updateView();
    }
  }

  async loadCurrency() {
    try {
      const res = await api.get("/settings/key/currency");
      const value = res?.data?.data?.setting_value;
      if (value) this.currencyCode = String(value).toUpperCase();
    } catch (e) {
      // keep default
    }
  }

  formatCurrency(value) {
    const val = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currencyCode || "USD",
    }).format(val);
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

  renderCategoriesRow() {
    if (this.categoriesLoading) {
      return `
        <section class="mb-12">
          <div class="flex items-center gap-4 overflow-x-auto pb-3 no-scrollbar -mx-2 px-2">
            ${Array(6)
              .fill(
                `<div class="animate-pulse min-w-[140px]">
                  <div class="h-24 w-24 rounded-2xl bg-slate-100 mb-3"></div>
                  <div class="h-3 w-20 bg-slate-100 rounded"></div>
                </div>`,
              )
              .join("")}
          </div>
        </section>
      `;
    }

    if (!this.categories || this.categories.length === 0) return "";

    const topCategories = this.categories.filter(
      (cat) => cat.parent_id === null || Number(cat.parent_id) === 0,
    );
    if (topCategories.length === 0) return "";

    return `
      <section class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Shop By Category</p>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Browse categories</h2>
          </div>
        </div>
        <div class="relative">
          <button
            type="button"
            class="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            data-carousel-prev="landing-categories"
            aria-label="Previous categories">
            <i class="fas fa-chevron-left text-xs"></i>
          </button>
          <button
            type="button"
            class="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            data-carousel-next="landing-categories"
            aria-label="Next categories">
            <i class="fas fa-chevron-right text-xs"></i>
          </button>
          <div class="flex items-start gap-5 overflow-x-auto pb-3 -mx-2 px-2 scroll-smooth" data-carousel-track="landing-categories">
          ${topCategories
            .map((cat) => {
              const image = this.getImageUrl(cat.image);
              return `
                <a href="/public/categories" class="group flex-[1_1_160px] min-w-[160px] max-w-[220px]">
                  <div class="w-full aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:shadow-lg transition-all">
                    ${
                      image
                        ? `<img src="${image}" alt="${cat.name || "Category"}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                        : `<div class="w-full h-full flex items-center justify-center text-slate-300 text-3xl"><i class="fas fa-layer-group"></i></div>`
                    }
                  </div>
                  <p class="mt-3 text-sm font-black text-slate-900">${cat.name || "Category"}</p>
                </a>
              `;
            })
            .join("")}
          </div>
          <div class="flex justify-center gap-2 mt-4" data-carousel-dots="landing-categories"></div>
        </div>
      </section>
    `;
  }

  renderHero() {
    if (this.pageLoading) {
      return `
        <section class="bg-slate-100 rounded-[2.5rem] p-10 sm:p-12 lg:p-16 mb-12 animate-pulse">
          <div class="h-6 w-40 bg-slate-200 rounded-full mb-6"></div>
          <div class="h-10 w-2/3 bg-slate-200 rounded-xl mb-4"></div>
          <div class="h-4 w-1/2 bg-slate-200 rounded mb-2"></div>
          <div class="h-4 w-1/3 bg-slate-200 rounded"></div>
        </section>
      `;
    }

    if (!this.pageData) return "";

    const title = this.pageData?.title || "";
    const subtitle = this.pageData?.subtitle || "";
    const content = this.pageData?.content || "";

    if (!this.heroImages.length) {
      return `
        <section class="bg-indigo-600 rounded-[2.5rem] p-10 sm:p-12 lg:p-16 text-center text-white mb-12 shadow-2xl overflow-hidden relative border border-indigo-500/50">
          <div class="relative z-10 max-w-3xl mx-auto">
            <div class="inline-block px-4 py-1.5 bg-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-5 border border-white/10 backdrop-blur-sm">
              VastCommerce Ecosystem Ready
            </div>
            ${title ? `<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 tracking-tighter leading-tight">${title}</h1>` : ""}
            ${subtitle ? `<p class="text-indigo-100/80 text-base sm:text-lg mb-6 font-medium">${subtitle}</p>` : ""}
            ${content ? `<div class="text-indigo-100/70 text-sm sm:text-base font-medium max-w-2xl mx-auto">${content}</div>` : ""}
            <div class="flex flex-wrap justify-center gap-4 mt-8">
              <a href="/public/products" class="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-900/20">Explore All Collections</a>
              <a href="/public/categories" class="bg-indigo-500/20 text-white border border-white/20 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md">Browse Categories</a>
            </div>
          </div>
          <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <i class="fas fa-shopping-bag text-[20rem] absolute -top-20 -left-20 rotate-12"></i>
            <i class="fas fa-rocket text-[14rem] absolute -bottom-24 -right-10 -rotate-12"></i>
          </div>
        </section>
      `;
    }

    const slides = this.heroImages
      .map((img, index) => {
        const url = this.getImageUrl(img);
        const active = index === this.heroIndex;
        return `
          <img
            src="${url}"
            alt="${title}"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${active ? "opacity-100" : "opacity-0"}"
          >
        `;
      })
      .join("");

    const dots =
      this.heroImages.length > 1
        ? `
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            ${this.heroImages
              .map(
                (_, index) => `
                  <span class="w-2 h-2 rounded-full ${index === this.heroIndex ? "bg-white" : "bg-white/40"}"></span>
                `,
              )
              .join("")}
          </div>
        `
        : "";

    return `
      <section class="relative overflow-hidden rounded-[2.5rem] mb-12 border border-slate-200 shadow-2xl group">
        <div class="relative h-[420px] sm:h-[520px] lg:h-[560px]">
          ${slides}
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/30"></div>
          <div class="absolute inset-0 bg-slate-950/20"></div>
          <div class="absolute inset-0 z-10 flex items-end sm:items-center">
            <div class="w-full px-6 sm:px-12 lg:px-16 py-10 sm:py-0 text-left text-white">
              <div class="max-w-2xl">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/70 mb-3">Featured Landing</p>
                ${title ? `<h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">${title}</h1>` : ""}
                ${subtitle ? `<p class="text-white/85 text-sm sm:text-lg mb-6">${subtitle}</p>` : ""}
                <div class="flex flex-wrap gap-4 mt-8">
                  <a href="/public/products" class="bg-white text-slate-900 px-7 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">Explore All Collections</a>
                  <a href="/public/categories" class="bg-white/10 text-white border border-white/20 px-7 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">Browse Categories</a>
                </div>
              </div>
            </div>
          </div>
          <div class="absolute inset-y-0 left-4 sm:left-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all"
              onclick="this.closest('app-root-page').prevHero()"
              aria-label="Previous slide">
              <i class="fas fa-chevron-left text-sm"></i>
            </button>
          </div>
          <div class="absolute inset-y-0 right-4 sm:right-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all"
              onclick="this.closest('app-root-page').nextHero()"
              aria-label="Next slide">
              <i class="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
          ${dots}
        </div>
      </section>
    `;
  }

  renderProductCard(p) {
    const image = this.getImageUrl(p.main_image) || "";
    const category = p.category_name || "General";
    const price = this.formatCurrency(p.base_price);

    return `
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-slate-50 rounded-[2.25rem] overflow-hidden mb-5 border border-slate-100 group-hover:shadow-2xl group-hover:shadow-indigo-100 transition-all duration-500">
          ${
            image
              ? `<img src="${image}" alt="${p.name || "Product"}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">`
              : `<div class="w-full h-full flex items-center justify-center text-slate-300 text-4xl"><i class="fas fa-image"></i></div>`
          }
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
            <a href="/public/products" class="w-full py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-colors text-center">View Details</a>
          </div>
        </div>
        <div class="px-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">${category}</p>
          <h3 class="text-base font-black text-slate-900 mb-1 leading-tight">${p.name || "Untitled Product"}</h3>
          <p class="text-lg font-black text-slate-900">${price}</p>
        </div>
      </div>
    `;
  }

  renderProductSkeleton() {
    return `
      <div class="animate-pulse">
        <div class="aspect-[4/5] bg-slate-100 rounded-[2.25rem] mb-5"></div>
        <div class="h-3 w-20 bg-slate-100 rounded mb-2"></div>
        <div class="h-4 w-36 bg-slate-100 rounded mb-2"></div>
        <div class="h-4 w-24 bg-slate-100 rounded"></div>
      </div>
    `;
  }

  render() {
    const featured = (this.products || []).slice(0, 8);
    const pageContent = this.pageData?.content || "";
    const pageContentAttr = pageContent.replace(/"/g, "&quot;");

    return `
      <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        ${this.renderHero()}

        ${
          pageContent
            ? `
            <section class="mb-12">
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <content-display content="${pageContentAttr}" no-styles></content-display>
              </div>
            </section>
          `
            : ""
        }

        ${this.renderCategoriesRow()}

        <section class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Featured Products</p>
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Latest arrivals to shop now</h2>
            </div>
            <a href="/public/products" class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full">View all</a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${
              this.loading
                ? Array(8).fill(this.renderProductSkeleton()).join("")
                : featured.length
                  ? featured.map((p) => this.renderProductCard(p)).join("")
                  : `<div class="col-span-full text-center text-slate-500 text-sm">No products available yet.</div>`
            }
          </div>
        </section>
      </div>
    `;
  }
}

customElements.define("app-root-page", RootPage);
