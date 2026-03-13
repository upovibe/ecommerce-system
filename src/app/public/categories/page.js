import App from "@/core/App.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/ContentDisplay.js";
import api from "@/services/api.js";

class CategoriesPage extends App {
  constructor() {
    super();
    this.categories = [];
    this.loading = true;
    this.pageData = null;
    this.pageLoading = true;
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
    await Promise.all([this.loadCategories(), this.loadPage()]);
  }

  async loadCategories() {
    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/categories");
      const data = res?.data?.data;
      const list = Array.isArray(data) ? data : [];
      this.categories = list.filter(
        (cat) => cat.parent_id === null || Number(cat.parent_id) === 0,
      );
    } catch (e) {
      console.error("Failed to load categories", e);
      this.categories = [];
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  async loadPage() {
    this.pageLoading = true;
    this.updateView();
    try {
      const res = await api.get("/pages/slug/category");
      this.pageData = res?.data?.data || null;
    } catch (e) {
      console.error("Failed to load categories page", e);
      this.pageData = null;
    } finally {
      this.pageLoading = false;
      this.updateView();
    }
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
    const banners = this.normalizeImageList(this.pageData?.banner_image);
    const gallery = this.normalizeImageList(this.pageData?.images);
    const image = banners[0] || gallery[0];
    if (!image) return "";

    return `
      <div class="mb-12">
        <div class="relative overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-2xl h-[280px] sm:h-[360px]">
          <img src="${this.getImageUrl(image)}" alt="Collections banner" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent"></div>
        </div>
      </div>
    `;
  }

  render() {
    const pageContent = this.pageData?.content || "";
    const pageContentAttr = pageContent.replace(/"/g, "&quot;");
    const title = this.pageData?.title || "Shop by Category";
    const subtitle =
      this.pageData?.subtitle ||
      "Discover our diverse range of premium collections, each curated to bring you the best in quality and style.";

    return `
      <div class="py-20 px-8 max-w-7xl mx-auto">
        <header class="mb-16 text-center">
          <p class="text-indigo-600 font-semibold text-xs mb-3">Store Collections</p>
          <h1 class="text-6xl font-black text-slate-900 tracking-tighter">${title}</h1>
          <p class="text-slate-500 mt-4 text-lg font-medium max-w-xl mx-auto">${subtitle}</p>
        </header>

        ${this.renderBanner()}

        ${
          pageContent
            ? `
            <div class="mb-12">
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <content-display content="${pageContentAttr}" no-styles></content-display>
              </div>
            </div>
          `
            : ""
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          ${
            this.loading
              ? Array(4)
                  .fill(
                    `<div class="animate-pulse h-96 rounded-[3rem] bg-slate-100"></div>`,
                  )
                  .join("")
              : this.categories.length
                ? this.categories.map((cat) => this.renderCategoryBanner(cat)).join("")
                : `<div class="col-span-full text-center text-slate-500 text-sm">No categories available yet.</div>`
          }
        </div>
      </div>
    `;
  }

  renderCategoryBanner(category) {
    const image = this.getImageUrl(category.image);
    const name = category.name || "Category";
    const description = category.description || "";
    const slug = category.slug || "";
    return `
      <a href="/public/products?category=${encodeURIComponent(slug)}" class="group relative h-96 rounded-[3rem] overflow-hidden cursor-pointer shadow-xl shadow-slate-100 transition-all hover:-translate-y-2 block">
          ${
            image
              ? `<img src="${image}" alt="${name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">`
              : `<div class="w-full h-full flex items-center justify-center text-slate-300 text-5xl bg-slate-50"><i class="fas fa-layer-group"></i></div>`
          }
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent flex flex-col justify-end p-12">
            ${description ? `<p class="text-white/70 font-semibold text-xs mb-2 line-clamp-2">${description}</p>` : ""}
            <h3 class="text-4xl font-black text-white mb-6">${name}</h3>
            <span class="w-fit px-8 py-3 bg-white text-slate-900 rounded-2xl font-semibold text-xs hover:bg-indigo-600 hover:text-white transition-colors">Explore Collection</span>
          </div>
      </a>
    `;
  }
}

customElements.define("app-categories-page", CategoriesPage);
export default CategoriesPage;
