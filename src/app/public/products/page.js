import App from "@/core/App.js";
import "@/components/ui/Skeleton.js";
import api from "@/services/api.js";

class ProductsPage extends App {
  constructor() {
    super();
    this.products = [];
    this.loading = true;
    this.categories = ["All"];
    this.categoriesMeta = [];
    this.activeCategory = "All";
    this.pendingCategory = "";
    this.activeCategoryId = null;
    this.activeParentCategoryId = null;
    this.activeSubcategoryId = null;
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
    await Promise.all([this.loadProducts(), this.loadCategoriesMeta()]);
  }

  async loadProducts() {
    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/products/public");
      const data = res?.data?.data;
      this.products = Array.isArray(data) ? data : [];
      const catSet = new Set(
        this.products
          .map((p) => p.category_name || "General")
          .filter(Boolean),
      );
      this.categories = ["All", ...Array.from(catSet)];
      this.applyCategoryFromQuery();
    } catch (e) {
      console.error("Failed to load products", e);
      this.products = [];
      this.categories = ["All"];
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  async loadCategoriesMeta() {
    try {
      const res = await api.get("/categories");
      const data = res?.data?.data;
      this.categoriesMeta = Array.isArray(data) ? data : [];
      console.log("[ProductsPage] categories loaded:", this.categoriesMeta);
      this.applyCategoryFromQuery();
      this.updateView();
    } catch (e) {
      this.categoriesMeta = [];
      this.updateView();
    }
  }

  set(key, value) {
    super.set(key, value);
    if (key === "queryParams") {
      this.pendingCategory = value?.category || "";
      this.applyCategoryFromQuery();
    }
    return this;
  }

  applyCategoryFromQuery() {
    const raw = (this.pendingCategory || "").trim();
    if (!raw) return;
    const slug = raw.toLowerCase();
    const matchBySlug = this.categoriesMeta.find(
      (c) => String(c.slug || "").toLowerCase() === slug,
    );
    this.activeCategoryId = matchBySlug?.id ?? null;
    if (matchBySlug) {
      const isParent =
        matchBySlug.parent_id === null || Number(matchBySlug.parent_id) === 0;
      this.activeParentCategoryId = isParent ? matchBySlug.id : null;
      this.activeSubcategoryId = isParent ? null : matchBySlug.id;
      this.updateView();
    }
  }

  attachEvents() {
    this.querySelectorAll("[data-subcategory-id]").forEach((card) => {
      card.addEventListener("click", (e) => {
        const value = e.currentTarget.dataset.subcategoryId;
        if (!value || value === "all") {
          this.activeSubcategoryId = null;
          this.updateView();
          return;
        }
        this.activeSubcategoryId = Number(value);
        this.updateView();
      });
    });

    this.initCarousel("product-subcategories");
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
      const gap = 12;
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

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const baseUrl = window.location.origin;
    if (path.startsWith("/api/")) return baseUrl + path;
    if (path.startsWith("/")) return baseUrl + path;
    if (path.startsWith("uploads/")) return `${baseUrl}/api/${path}`;
    return `${baseUrl}/api/${path.replace(/^\//, "")}`;
  }

  formatCurrency(value) {
    const val = Number(value || 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  }

  getFilteredProducts() {
    if (!this.products.length) return [];
    if (this.activeSubcategoryId) {
      return this.products.filter(
        (p) => Number(p.category_id) === Number(this.activeSubcategoryId),
      );
    }
    if (this.activeParentCategoryId) {
      const children = this.categoriesMeta
        .filter((c) => Number(c.parent_id) === Number(this.activeParentCategoryId))
        .map((c) => c.id);
      if (!children.length) return this.products;
      return this.products.filter((p) => children.includes(Number(p.category_id)));
    }
    return this.products;
  }

  getSubcategories() {
    const list = Array.isArray(this.categoriesMeta) ? this.categoriesMeta : [];
    const usedCategoryIds = new Set(
      (this.products || []).map((p) => Number(p.category_id)).filter(Boolean),
    );
    const allSubcategories = list.filter((c) =>
      usedCategoryIds.has(Number(c.id)),
    );
    if (this.activeParentCategoryId) {
      const scoped = allSubcategories.filter(
        (c) => Number(c.parent_id) === Number(this.activeParentCategoryId),
      );
      return scoped.length ? scoped : allSubcategories;
    }
    return allSubcategories;
  }

  renderSubcategoriesRow() {
    const subs = this.getSubcategories();
    console.log("[ProductsPage] subcategories:", subs);
    if (this.loading) {
      return `
        <div class="mb-10">
          <div class="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
            ${Array(6)
              .fill(
                `<div class="animate-pulse min-w-[140px]">
                  <div class="h-24 w-24 rounded-2xl bg-slate-100 mb-3"></div>
                  <div class="h-3 w-20 bg-slate-100 rounded"></div>
                </div>`,
              )
              .join("")}
          </div>
        </div>
      `;
    }
    if (!subs.length) return "";

    return `
      <div class="mb-10">
        <div class="relative">
          <button
            type="button"
            class="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            data-carousel-prev="product-subcategories"
            aria-label="Previous subcategories">
            <i class="fas fa-chevron-left text-xs"></i>
          </button>
          <button
            type="button"
            class="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            data-carousel-next="product-subcategories"
            aria-label="Next subcategories">
            <i class="fas fa-chevron-right text-xs"></i>
          </button>
          <div class="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 scroll-smooth" data-carousel-track="product-subcategories">
          <div data-subcategory-id="all" class="group flex-[1_1_160px] min-w-[160px] max-w-[220px] cursor-pointer">
            <div class="w-full aspect-square rounded-2xl border border-slate-200 bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all">
              <i class="fas fa-layer-group text-3xl"></i>
            </div>
            <p class="mt-3 text-sm font-black text-slate-900">All</p>
          </div>
          ${subs
            .map((sub) => {
              const image = this.getImageUrl(sub.image);
              return `
                <div data-subcategory-id="${sub.id}" class="group flex-[1_1_160px] min-w-[160px] max-w-[220px] cursor-pointer">
                  <div class="w-full aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:shadow-lg transition-all">
                    ${
                      image
                        ? `<img src="${image}" alt="${sub.name || "Subcategory"}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
                        : `<div class="w-full h-full flex items-center justify-center text-slate-300 text-3xl"><i class="fas fa-layer-group"></i></div>`
                    }
                  </div>
                  <p class="mt-3 text-sm font-black text-slate-900">${sub.name || "Subcategory"}</p>
                </div>
              `;
            })
            .join("")}
          </div>
          <div class="flex justify-center gap-2 mt-4" data-carousel-dots="product-subcategories"></div>
        </div>
      </div>
    `;
  }

  render() {
    const filtered = this.getFilteredProducts();
    const categories =
      Array.isArray(this.categories) && this.categories.length
        ? this.categories
        : ["All"];

    return `
      <div class="py-20 px-8 max-w-7xl mx-auto">
        <header class="mb-16">
          <div class="flex items-center gap-3 text-indigo-600 font-semibold text-xs mb-2">
            <span class="w-8 h-px bg-indigo-600"></span> Vast Catalog
          </div>
          <h1 class="text-6xl font-black text-slate-900 tracking-tighter">Premium <span class="text-indigo-600">Collection</span></h1>
          <p class="text-slate-500 mt-4 text-lg font-medium max-w-2xl">Browse our curated selection of high-quality products across all categories. Designed for excellence, built for you.</p>
        </header>

        ${this.renderSubcategoriesRow()}

        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          ${this.loading
            ? Array(8)
                .fill(
                  `<div class="animate-pulse">
                    <div class="aspect-[4/5] bg-slate-100 rounded-[2.5rem] mb-6"></div>
                    <div class="h-3 w-20 bg-slate-100 rounded mb-2"></div>
                    <div class="h-4 w-36 bg-slate-100 rounded mb-2"></div>
                    <div class="h-4 w-24 bg-slate-100 rounded"></div>
                  </div>`,
                )
                .join("")
            : filtered.length
              ? filtered.map((p) => this.renderProductCard(p)).join("")
              : `<div class="col-span-full text-center text-slate-500 text-sm">No products found in this category.</div>`}
        </div>
      </div>
    `;
  }

  renderProductCard(product) {
    const name = product.name || "Untitled Product";
    const category = product.category_name || "General";
    const price = this.formatCurrency(product.base_price);
    const image = this.getImageUrl(product.main_image);
    return `
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-slate-50 rounded-[2.5rem] overflow-hidden mb-6 group-hover:shadow-2xl group-hover:shadow-indigo-100 transition-all duration-500">
          ${
            image
              ? `<img src="${image}" alt="${name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">`
              : `<div class="w-full h-full flex items-center justify-center text-slate-300 text-4xl"><i class="fas fa-image"></i></div>`
          }
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
            <button class="w-full py-4 bg-white text-slate-900 rounded-2xl font-semibold text-xs hover:bg-indigo-600 hover:text-white transition-colors">Quick View</button>
          </div>
          <div class="absolute top-6 right-6">
            <button class="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
              <i class="far fa-heart"></i>
            </button>
          </div>
        </div>
        <div class="px-2">
          <p class="text-xs font-semibold text-indigo-600 mb-1">${category}</p>
          <h3 class="text-lg font-black text-slate-900 mb-2 leading-tight">${name}</h3>
          <p class="text-xl font-black text-slate-900">${price}</p>
        </div>
      </div>
    `;
  }
}

customElements.define("app-products-page", ProductsPage);
export default ProductsPage;
