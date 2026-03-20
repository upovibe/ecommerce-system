import App from "@/core/App.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/ContentDisplay.js";
import "@/components/ui/Input.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Accordion.js";
import "@/components/ui/Checkbox.js";
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
    this.currencyCode = "USD";
    this.pageData = null;
    this.pageLoading = true;
    this.allowLogin = true;
    this.bannerImages = [];
    this.bannerIndex = 0;
    this.bannerTimer = null;
    this.bannerRotationMs = 5000;
    this.searchTerm = "";
    this.sortBy = "newest";
    this.priceMin = "";
    this.priceMax = "";
    this.inStockOnly = false;
    this.selectedBrands = new Set();
    this.selectedMaterials = new Set();
    this.variantFilterOptions = {};
    this.attributeFilterOptions = {};
    this.variantFilterMap = {};
    this.attributeFilterMap = {};
    this.selectedVariantFilters = {};
    this.selectedAttributeFilters = {};
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
    this.wishlistIds = new Set();
    await Promise.all([
      this.loadProducts(),
      this.loadCategoriesMeta(),
      this.loadCurrency(),
      this.loadPage(),
      this.loadLoginSetting(),
      this.loadFilters(),
      this.loadWishlistIds(),
    ]);
  }

  disconnectedCallback() {
    if (this.bannerTimer) {
      clearInterval(this.bannerTimer);
      this.bannerTimer = null;
    }
  }

  async loadWishlistIds() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get("/wishlist");
      const items = res?.data?.data || [];
      this.wishlistIds = new Set(items.map((item) => Number(item.product_id)));
      this.updateView();
    } catch (_) {
      this.wishlistIds = new Set();
    }
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
      this.applyCategoryFromQuery();
      this.updateView();
    } catch (e) {
      this.categoriesMeta = [];
      this.updateView();
    }
  }

  async loadCurrency() {
    try {
      const res = await api.get("/settings/key/currency");
      const value = res?.data?.data?.setting_value;
      if (value) this.currencyCode = String(value).toUpperCase();
    } catch (_) {
      // keep default
    }
  }

  async loadLoginSetting() {
    try {
      const res = await api.get("/settings/key/enable_user_login");
      const raw = String(res?.data?.data?.setting_value ?? "1").toLowerCase();
      this.allowLogin = !(raw === "0" || raw === "false" || raw === "no");
    } catch (_) {
      this.allowLogin = true;
    }
  }

  getCategoryScopedProducts() {
    if (!this.products.length) return [];
    let list = [...this.products];
    if (this.activeSubcategoryId) {
      list = list.filter(
        (p) => Number(p.category_id) === Number(this.activeSubcategoryId),
      );
    } else if (this.activeParentCategoryId) {
      const children = this.categoriesMeta
        .filter((c) => Number(c.parent_id) === Number(this.activeParentCategoryId))
        .map((c) => c.id);
      if (children.length) {
        list = list.filter((p) => children.includes(Number(p.category_id)));
      }
    }
    return list;
  }

  async loadFilters() {
    try {
      const res = await api.get("/products/public-filters");
      const data = res?.data?.data || {};
      this.variantFilterOptions = data?.variants?.options || {};
      this.variantFilterMap = data?.variants?.map || {};
      this.attributeFilterOptions = data?.attributes?.options || {};
      this.attributeFilterMap = data?.attributes?.map || {};
    } catch (_) {
      this.variantFilterOptions = {};
      this.variantFilterMap = {};
      this.attributeFilterOptions = {};
      this.attributeFilterMap = {};
    }
  }

  async loadPage() {
    this.pageLoading = true;
    this.updateView();
    try {
      const res = await api.get("/pages/slug/product");
      this.pageData = res?.data?.data || null;
      const banners = this.normalizeImageList(this.pageData?.banner_image);
      const gallery = this.normalizeImageList(this.pageData?.images);
      this.bannerImages = banners.length ? [...banners, ...gallery] : gallery;
      this.bannerIndex = 0;
      this.startBannerRotation();
    } catch (e) {
      console.error("Failed to load category page content", e);
      this.pageData = null;
      this.bannerImages = [];
      this.bannerIndex = 0;
    } finally {
      this.pageLoading = false;
      this.updateView();
    }
  }

  startBannerRotation() {
    if (this.bannerTimer) {
      clearInterval(this.bannerTimer);
      this.bannerTimer = null;
    }
    if (this.bannerImages.length <= 1) return;
    this.bannerTimer = setInterval(() => {
      this.bannerIndex = (this.bannerIndex + 1) % this.bannerImages.length;
      this.updateView();
    }, this.bannerRotationMs);
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

  renderBanner() {
    const images = this.bannerImages || [];
    if (!images.length) return "";

    const slides = images
      .map(
        (img, idx) => `
          <img
            src="${this.getImageUrl(img)}"
            alt="Products banner ${idx + 1}"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === this.bannerIndex ? "opacity-100" : "opacity-0"}"
            data-banner-slide
          >
        `,
      )
      .join("");

    return `
      <div class="mb-12">
        <div class="relative overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-2xl h-[280px] sm:h-[360px]">
          ${slides}
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent"></div>
        </div>
      </div>
    `;
  }
  async loadCurrency() {
    try {
      const res = await api.get("/settings/key/currency");
      const value = res?.data?.data?.setting_value;
      if (value) this.currencyCode = String(value).toUpperCase();
    } catch (_) {
      // keep default
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

    this.querySelectorAll("[data-wishlist-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.wishlistId;
        if (!id) return;
        this.addToWishlist(id);
      });
    });

    const search = this.querySelector("#product-search");
    if (search) {
      search.addEventListener("input", (e) => {
        this.searchTerm = e.detail?.value ?? "";
        this.updateView();
      });
    }

    const sort = this.querySelector("#product-sort");
    if (sort) {
      sort.addEventListener("change", (e) => {
        this.sortBy = e.detail?.value || "newest";
        this.updateView();
      });
    }

    const min = this.querySelector("#price-min");
    if (min) {
      min.addEventListener("input", (e) => {
        this.priceMin = e.detail?.value ?? "";
        this.updateView();
      });
    }
    const max = this.querySelector("#price-max");
    if (max) {
      max.addEventListener("input", (e) => {
        this.priceMax = e.detail?.value ?? "";
        this.updateView();
      });
    }

    const stock = this.querySelector("#stock-only");
    if (stock) {
      stock.addEventListener("change", (e) => {
        this.inStockOnly = !!e.detail?.checked;
        this.updateView();
      });
    }

    const brandSelect = this.querySelector("#brand-filter");
    if (brandSelect) {
      brandSelect.addEventListener("change", (e) => {
        const raw = e.detail?.value || "";
        this.selectedBrands = new Set(
          raw
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        );
        this.updateView();
      });
    }

    const materialSelect = this.querySelector("#material-filter");
    if (materialSelect) {
      materialSelect.addEventListener("change", (e) => {
        const raw = e.detail?.value || "";
        this.selectedMaterials = new Set(
          raw
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        );
        this.updateView();
      });
    }

      const clear = this.querySelector("#clear-filters");
      if (clear) {
        clear.addEventListener("click", () => {
          this.searchTerm = "";
          this.sortBy = "newest";
          this.priceMin = "";
          this.priceMax = "";
          this.inStockOnly = false;
          this.selectedBrands.clear();
          this.selectedMaterials.clear();
          this.selectedVariantFilters = {};
          this.selectedAttributeFilters = {};
          this.activeSubcategoryId = null;
          const brandSelectEl = this.querySelector("#brand-filter");
          if (brandSelectEl) brandSelectEl.value = [];
          const materialSelectEl = this.querySelector("#material-filter");
          if (materialSelectEl) materialSelectEl.value = [];
          const searchEl = this.querySelector("#product-search");
          if (searchEl) searchEl.setAttribute("value", "");
          const minEl = this.querySelector("#price-min");
          if (minEl) minEl.setAttribute("value", "");
          const maxEl = this.querySelector("#price-max");
          if (maxEl) maxEl.setAttribute("value", "");
          const rangeMin = this.querySelector("#price-range-min");
          if (rangeMin) rangeMin.value = "";
          const rangeMax = this.querySelector("#price-range-max");
          if (rangeMax) rangeMax.value = "";
          this.updateView();
        });
      }

      const rangeMin = this.querySelector("#price-range-min");
      if (rangeMin) {
        rangeMin.addEventListener("input", (e) => {
          this.priceMin = e.target?.value ?? "";
          this.updateView();
        });
      }
      const rangeMax = this.querySelector("#price-range-max");
      if (rangeMax) {
        rangeMax.addEventListener("input", (e) => {
          this.priceMax = e.target?.value ?? "";
          this.updateView();
        });
      }

      this.querySelectorAll("[data-variant-filter]").forEach((el) => {
        el.addEventListener("change", (e) => {
          const type = el.dataset.type;
          const value = el.dataset.value;
          const checked = e.detail?.checked ?? e.target?.checked;
          if (!type || !value) return;
          if (!this.selectedVariantFilters[type]) this.selectedVariantFilters[type] = new Set();
          if (checked) this.selectedVariantFilters[type].add(value);
          else this.selectedVariantFilters[type].delete(value);
          this.updateView();
        });
      });

      this.querySelectorAll("[data-attribute-filter]").forEach((el) => {
        el.addEventListener("change", (e) => {
          const type = el.dataset.type;
          const value = el.dataset.value;
          const checked = e.detail?.checked ?? e.target?.checked;
          if (!type || !value) return;
          if (!this.selectedAttributeFilters[type]) this.selectedAttributeFilters[type] = new Set();
          if (checked) this.selectedAttributeFilters[type].add(value);
          else this.selectedAttributeFilters[type].delete(value);
          this.updateView();
        });
      });
    }

  async addToWishlist(productId) {
    const token = localStorage.getItem("token");
    const id = Number(productId);
    if (this.allowLogin) {
      if (!token) {
        const current = `${window.location.pathname}${window.location.search || ""}`;
        localStorage.setItem("post_login_redirect", current);
        window.Toast?.show?.({
          title: "Sign in required",
          message: "Please sign in to save items.",
          variant: "warning",
        });
        setTimeout(() => {
          window.location.href = "/auth/customer-login";
        }, 600);
        return;
      }
      try {
        await api.post("/wishlist/items", { product_id: id });
        this.wishlistIds.add(id);
        this.updateView();
        window.Toast?.show?.({
          title: "Saved",
          message: "Added to wishlist.",
          variant: "success",
        });
      } catch (e) {
        window.Toast?.show?.({
          title: "Error",
          message: e.response?.data?.message || "Failed to update wishlist.",
          variant: "error",
        });
      }
      return;
    }

    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
    } catch (_) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    if (!list.some((item) => Number(item.product_id) === id)) {
      list.push({ product_id: id });
      localStorage.setItem("guest_wishlist", JSON.stringify(list));
      this.wishlistIds.add(id);
      this.updateView();
    }
    window.Toast?.show?.({
      title: "Saved",
      message: "Added to wishlist.",
      variant: "success",
    });
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
      const hasOverflow = track.scrollWidth > track.clientWidth + 2;
      track.classList.toggle("no-scrollbar", !hasOverflow);
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currencyCode || "USD",
    }).format(val);
  }

  getFilteredProducts() {
    if (!this.products.length) return [];
    let list = [...this.products];

    if (this.activeSubcategoryId) {
      list = list.filter(
        (p) => Number(p.category_id) === Number(this.activeSubcategoryId),
      );
    } else if (this.activeParentCategoryId) {
      const children = this.categoriesMeta
        .filter((c) => Number(c.parent_id) === Number(this.activeParentCategoryId))
        .map((c) => c.id);
      if (children.length) {
        list = list.filter((p) => children.includes(Number(p.category_id)));
      }
    }

    const q = this.searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const brand = String(p.brand_name || "").toLowerCase();
        const category = String(p.category_name || "").toLowerCase();
        return name.includes(q) || brand.includes(q) || category.includes(q);
      });
    }

    const minVal = this.priceMin !== "" ? Number(this.priceMin) : null;
    const maxVal = this.priceMax !== "" ? Number(this.priceMax) : null;
    if (minVal !== null && !Number.isNaN(minVal)) {
      list = list.filter((p) => Number(p.base_price || 0) >= minVal);
    }
    if (maxVal !== null && !Number.isNaN(maxVal)) {
      list = list.filter((p) => Number(p.base_price || 0) <= maxVal);
    }

    if (this.inStockOnly) {
      list = list.filter((p) => Number(p.total_stock || 0) > 0);
    }

    if (this.selectedBrands.size) {
      list = list.filter((p) => this.selectedBrands.has(p.brand_name || ""));
    }

      if (this.selectedMaterials.size) {
        list = list.filter((p) => this.selectedMaterials.has(p.material_name || ""));
      }

      const hasVariantFilters = Object.values(this.selectedVariantFilters || {}).some(
        (s) => s && s.size,
      );
      if (hasVariantFilters) {
        list = list.filter((p) => {
          const variants = this.variantFilterMap?.[p.id] || [];
          return Object.entries(this.selectedVariantFilters).every(([type, values]) => {
            if (!values || !values.size) return true;
            return variants.some((v) => v.type === type && values.has(v.value));
          });
        });
      }

      const hasAttributeFilters = Object.values(this.selectedAttributeFilters || {}).some(
        (s) => s && s.size,
      );
      if (hasAttributeFilters) {
        list = list.filter((p) => {
          const attrs = this.attributeFilterMap?.[p.id] || [];
          return Object.entries(this.selectedAttributeFilters).every(([type, values]) => {
            if (!values || !values.size) return true;
            return attrs.some((a) => a.type === type && values.has(a.value));
          });
        });
      }

    switch (this.sortBy) {
      case "price_asc":
        list.sort((a, b) => Number(a.base_price || 0) - Number(b.base_price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.base_price || 0) - Number(a.base_price || 0));
        break;
      case "name_asc":
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        break;
      case "name_desc":
        list.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
        break;
      default:
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list;
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
          <div data-subcategory-id="all" class="group cursor-pointer" style="flex: 0 0 calc((100% - 48px) / 5); min-width: 160px; max-width: 220px;">
            <div class="w-full aspect-square rounded-2xl border ${this.activeSubcategoryId === null ? "border-slate-900 ring-2 ring-slate-900/20" : "border-slate-200"} bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all">
              <i class="fas fa-layer-group text-3xl"></i>
            </div>
            <p class="mt-3 text-sm font-black text-slate-900">All</p>
          </div>
          ${subs
            .map((sub) => {
              const image = this.getImageUrl(sub.image);
              return `
                <div data-subcategory-id="${sub.id}" class="group cursor-pointer" style="flex: 0 0 calc((100% - 48px) / 5); min-width: 160px; max-width: 220px;">
                  <div class="w-full aspect-square rounded-2xl bg-slate-50 border ${this.activeSubcategoryId === Number(sub.id) ? "border-slate-900 ring-2 ring-slate-900/20" : "border-slate-100"} overflow-hidden shadow-sm group-hover:shadow-lg transition-all">
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
    if (this.pageLoading) {
      return `
        <div class="py-20 px-8 max-w-7xl mx-auto">
          <header class="mb-16">
            <div class="flex items-center gap-3 mb-2">
              <div class="h-2 w-8 bg-slate-100 rounded-full animate-pulse"></div>
              <div class="h-2 w-20 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
            <div class="h-12 w-[420px] bg-slate-100 rounded-3xl animate-pulse"></div>
            <div class="h-4 w-[520px] bg-slate-100 rounded-2xl animate-pulse mt-4"></div>
          </header>

          <div class="mb-12">
            <div class="h-[280px] sm:h-[360px] rounded-[2.5rem] bg-slate-100 animate-pulse"></div>
          </div>

          <div class="mb-12">
            <div class="h-32 rounded-2xl bg-slate-100 animate-pulse"></div>
          </div>

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

          <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
            <aside class="bg-white border border-slate-200 rounded-3xl p-6 h-fit">
              ${Array(6)
                .fill('<div class="h-10 bg-slate-100 rounded-2xl animate-pulse mb-4"></div>')
                .join("")}
            </aside>
            <section>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                ${Array(10)
                  .fill(
                    `<div class="animate-pulse">
                      <div class="aspect-[4/5] bg-slate-100 rounded-[2.5rem] mb-6"></div>
                      <div class="h-3 w-20 bg-slate-100 rounded mb-2"></div>
                      <div class="h-4 w-36 bg-slate-100 rounded mb-2"></div>
                      <div class="h-4 w-24 bg-slate-100 rounded"></div>
                    </div>`,
                  )
                  .join("")}
              </div>
            </section>
          </div>
        </div>
      `;
    }
    const filtered = this.getFilteredProducts();
    const scopedProducts = this.getCategoryScopedProducts();
    const scopedIds = new Set(scopedProducts.map((p) => p.id));
    const scopedVariantOptions = {};
    Object.keys(this.variantFilterOptions || {}).forEach((type) => {
      const values = this.variantFilterOptions[type] || [];
      const scoped = new Set();
      scopedProducts.forEach((p) => {
        const list = this.variantFilterMap?.[p.id] || [];
        list.forEach((v) => {
          if (v.type === type && values.includes(v.value)) scoped.add(v.value);
        });
      });
      if (scoped.size) scopedVariantOptions[type] = Array.from(scoped);
    });
    const scopedAttributeOptions = {};
    Object.keys(this.attributeFilterOptions || {}).forEach((type) => {
      const values = this.attributeFilterOptions[type] || [];
      const scoped = new Set();
      scopedProducts.forEach((p) => {
        const list = this.attributeFilterMap?.[p.id] || [];
        list.forEach((a) => {
          if (a.type === type && values.includes(a.value)) scoped.add(a.value);
        });
      });
      if (scoped.size) scopedAttributeOptions[type] = Array.from(scoped);
    });
    const pageContent = this.pageData?.content || "";
    const pageContentAttr = pageContent.replace(/"/g, "&quot;");
    const title = this.pageLoading ? "" : this.pageData?.title || "Premium Collection";
    const subtitle = this.pageLoading
      ? ""
      : this.pageData?.subtitle ||
        "Browse our curated selection of high-quality products across all categories. Designed for excellence, built for you.";
    const filterOptions = this.getFilterOptions();
    const priceBounds = this.getPriceBounds();

    return `
      <div class="py-20 px-8 max-w-7xl mx-auto">
        <header class="mb-16">
          ${
            this.pageLoading
              ? `
            <div class="flex items-center gap-3 mb-2">
              <div class="h-2 w-8 bg-slate-100 rounded-full animate-pulse"></div>
              <div class="h-2 w-20 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
            <div class="h-12 w-[420px] bg-slate-100 rounded-3xl animate-pulse"></div>
            <div class="h-4 w-[520px] bg-slate-100 rounded-2xl animate-pulse mt-4"></div>
          `
              : `
            <div class="flex items-center gap-3 text-indigo-600 font-semibold text-xs mb-2">
              <span class="w-8 h-px bg-indigo-600"></span> Vast Catalog
            </div>
            <h1 class="text-6xl font-black text-slate-900 tracking-tighter">${title}</h1>
            <p class="text-slate-500 mt-4 text-lg font-medium max-w-2xl">${subtitle}</p>
          `
          }
        </header>

        ${
          this.pageLoading
            ? `
            <div class="mb-12">
              <div class="h-[280px] sm:h-[360px] rounded-[2.5rem] bg-slate-100 animate-pulse"></div>
            </div>
          `
            : this.renderBanner()
        }

        ${
          this.pageLoading
            ? `
            <div class="mb-12">
              <div class="h-32 rounded-2xl bg-slate-100 animate-pulse"></div>
            </div>
          `
            : pageContent
            ? `
            <div class="mb-12">
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <content-display content="${pageContentAttr}" no-styles></content-display>
              </div>
            </div>
          `
            : ""
        }

        ${this.renderSubcategoriesRow()}

        <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <aside class="bg-white border border-slate-200 rounded-3xl p-6 h-fit lg:sticky lg:top-28">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-black text-slate-900">Filter Studio</h2>
              <button id="clear-filters" class="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Clear</button>
            </div>

            <div class="space-y-5">
              <div>
                <label class="text-[11px] font-semibold text-slate-500">Search products</label>
                <ui-input
                  id="product-search"
                  placeholder="Search products..."
                  value="${this.searchTerm}">
                </ui-input>
              </div>

              <div>
                <label class="text-[11px] font-semibold text-slate-500">Sort</label>
                <ui-dropdown id="product-sort" value="${this.sortBy}">
                  <ui-option value="newest">Newest first</ui-option>
                  <ui-option value="price_asc">Price: low to high</ui-option>
                  <ui-option value="price_desc">Price: high to low</ui-option>
                  <ui-option value="name_asc">Name: A-Z</ui-option>
                  <ui-option value="name_desc">Name: Z-A</ui-option>
                </ui-dropdown>
              </div>

                <div>
                  <label class="text-[11px] font-semibold text-slate-500">Price range</label>
                  <div class="mt-2 grid grid-cols-2 gap-3">
                    <ui-input id="price-min" type="number" label="Min price" placeholder="${priceBounds.min}" value="${this.priceMin}"></ui-input>
                    <ui-input id="price-max" type="number" label="Max price" placeholder="${priceBounds.max}" value="${this.priceMax}"></ui-input>
                  </div>
                  <div class="mt-3">
                    <input id="price-range-min" type="range" min="${priceBounds.min}" max="${priceBounds.max}" value="${this.priceMin || priceBounds.min}" class="w-full accent-slate-900">
                    <input id="price-range-max" type="range" min="${priceBounds.min}" max="${priceBounds.max}" value="${this.priceMax || priceBounds.max}" class="w-full accent-slate-900 mt-2">
                    <div class="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>${this.priceMin || priceBounds.min}</span>
                      <span>${this.priceMax || priceBounds.max}</span>
                    </div>
                  </div>
                </div>

              <div>
                <label class="text-[11px] font-semibold text-slate-500">Stock</label>
                <div class="mt-2 flex items-center">
                  <ui-switch id="stock-only" ${this.inStockOnly ? "checked" : ""} label="In stock only"></ui-switch>
                </div>
              </div>

                <div>
                  <label class="text-[11px] font-semibold text-slate-500">Brands</label>
                  <ui-dropdown id="brand-filter" multiple searchable placeholder="Select brands">
                    ${filterOptions.brands
                      .map((b) => `<ui-option value="${b}">${b}</ui-option>`)
                      .join("")}
                  </ui-dropdown>
                </div>

                <div>
                  <label class="text-[11px] font-semibold text-slate-500">Materials</label>
                  <ui-dropdown id="material-filter" multiple searchable placeholder="Select materials">
                    ${filterOptions.materials
                      .map((m) => `<ui-option value="${m}">${m}</ui-option>`)
                      .join("")}
                  </ui-dropdown>
                </div>

                ${
                  Object.keys(scopedVariantOptions || {}).length
                    ? `
                  <ui-accordion class="mt-2">
                    ${Object.entries(scopedVariantOptions)
                      .map(([type, values]) => `
                        <ui-accordion-item title="${type}">
                          <div class="grid grid-cols-2 gap-2">
                            ${(values || []).map((val) => `
                              <ui-checkbox data-variant-filter data-type="${type}" data-value="${val}" label="${val}" ${this.selectedVariantFilters?.[type]?.has(val) ? "checked" : ""}></ui-checkbox>
                            `).join("")}
                          </div>
                        </ui-accordion-item>
                      `).join("")}
                  </ui-accordion>
                `
                    : ""
                }

                ${
                  Object.keys(scopedAttributeOptions || {}).length
                    ? `
                  <ui-accordion class="mt-2">
                    ${Object.entries(scopedAttributeOptions)
                      .map(([type, values]) => `
                        <ui-accordion-item title="${type}">
                          <div class="grid grid-cols-2 gap-2">
                            ${(values || []).map((val) => `
                              <ui-checkbox data-attribute-filter data-type="${type}" data-value="${val}" label="${val}" ${this.selectedAttributeFilters?.[type]?.has(val) ? "checked" : ""}></ui-checkbox>
                            `).join("")}
                          </div>
                        </ui-accordion-item>
                      `).join("")}
                  </ui-accordion>
                `
                    : ""
                }
            </div>
          </aside>

          <section>
            <div class="flex items-center justify-between mb-6">
              <p class="text-sm text-slate-500">Showing <span class="text-slate-900 font-semibold">${filtered.length}</span> items</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              ${this.loading
                ? Array(10)
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
                  : `<div class="col-span-full text-center text-slate-500 text-sm">No products found.</div>`}
            </div>
          </section>
        </div>
      </div>
    `;
  }

  getFilterOptions() {
    const brands = new Set();
    const materials = new Set();
    (this.products || []).forEach((p) => {
      if (p.brand_name) brands.add(p.brand_name);
      if (p.material_name) materials.add(p.material_name);
    });
    return {
      brands: Array.from(brands).sort(),
      materials: Array.from(materials).sort(),
    };
  }

  getPriceBounds() {
    const prices = (this.products || [])
      .map((p) => Number(p.base_price || 0))
      .filter((p) => !Number.isNaN(p));
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }

  renderProductCard(product) {
    const name = product.name || "Untitled Product";
    const category = product.category_name || "General";
    const price = this.formatCurrency(product.base_price);
    const image = this.getImageUrl(product.main_image);
    const slug = product.slug || product.id;
    const url = `/public/products/${slug}`;
    const isLiked = this.wishlistIds && this.wishlistIds.has(Number(product.id));

    return `
      <div class="group block relative">
        <a href="${url}" class="block">
          <div class="relative aspect-[4/5] bg-slate-50 rounded-[1.75rem] overflow-hidden mb-5 group-hover:shadow-2xl group-hover:shadow-indigo-100 transition-all duration-500 border border-slate-100">
            ${
              image
                ? `<img src="${image}" alt="${name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">`
                : `<div class="w-full h-full flex items-center justify-center text-slate-300 text-4xl"><i class="fas fa-image"></i></div>`
            }
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
              <span class="w-full py-3 bg-white text-slate-900 rounded-xl font-semibold text-xs hover:bg-indigo-600 hover:text-white transition-colors text-center">Quick View</span>
            </div>
          </div>
          <div class="px-2 min-w-0">
            <p class="text-xs font-semibold text-indigo-600 mb-1">${category}</p>
            <h3 class="text-lg font-black text-slate-900 mb-2 leading-tight">${name}</h3>
            <p class="text-base font-black text-slate-900 break-words leading-tight">${price}</p>
          </div>
        </a>
        <div class="absolute top-6 right-6 z-20">
          <button 
            data-wishlist-id="${product.id}" 
            class="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl flex items-center justify-center ${isLiked ? "text-rose-500 shadow-rose-100" : "text-slate-400"} hover:text-rose-500 transition-all shadow-xl hover:scale-110"
          >
            <i class="${isLiked ? "fas" : "far"} fa-heart"></i>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define("app-products-page", ProductsPage);
export default ProductsPage;
